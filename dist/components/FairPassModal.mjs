function noop() {
}
const identity = (x) => x;
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
const is_client = typeof window !== "undefined";
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
const tasks = /* @__PURE__ */ new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
let is_hydrating = false;
function start_hydrating() {
  is_hydrating = true;
}
function end_hydrating() {
  is_hydrating = false;
}
function upper_bound(low, high, key, value) {
  while (low < high) {
    const mid = low + (high - low >> 1);
    if (key(mid) <= value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
function init_hydrate(target) {
  if (target.hydrate_init)
    return;
  target.hydrate_init = true;
  let children2 = target.childNodes;
  if (target.nodeName === "HEAD") {
    const myChildren = [];
    for (let i = 0; i < children2.length; i++) {
      const node = children2[i];
      if (node.claim_order !== void 0) {
        myChildren.push(node);
      }
    }
    children2 = myChildren;
  }
  const m = new Int32Array(children2.length + 1);
  const p = new Int32Array(children2.length);
  m[0] = -1;
  let longest = 0;
  for (let i = 0; i < children2.length; i++) {
    const current = children2[i].claim_order;
    const seqLen = (longest > 0 && children2[m[longest]].claim_order <= current ? longest + 1 : upper_bound(1, longest, (idx) => children2[m[idx]].claim_order, current)) - 1;
    p[i] = m[seqLen] + 1;
    const newLen = seqLen + 1;
    m[newLen] = i;
    longest = Math.max(newLen, longest);
  }
  const lis = [];
  const toMove = [];
  let last = children2.length - 1;
  for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
    lis.push(children2[cur - 1]);
    for (; last >= cur; last--) {
      toMove.push(children2[last]);
    }
    last--;
  }
  for (; last >= 0; last--) {
    toMove.push(children2[last]);
  }
  lis.reverse();
  toMove.sort((a, b) => a.claim_order - b.claim_order);
  for (let i = 0, j = 0; i < toMove.length; i++) {
    while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
      j++;
    }
    const anchor = j < lis.length ? lis[j] : null;
    target.insertBefore(toMove[i], anchor);
  }
}
function append(target, node) {
  target.appendChild(node);
}
function get_root_for_style(node) {
  if (!node)
    return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && root.host) {
    return root;
  }
  return node.ownerDocument;
}
function append_empty_stylesheet(node) {
  const style_element = element("style");
  append_stylesheet(get_root_for_style(node), style_element);
  return style_element.sheet;
}
function append_stylesheet(node, style) {
  append(node.head || node, style);
  return style.sheet;
}
function append_hydration(target, node) {
  if (is_hydrating) {
    init_hydrate(target);
    if (target.actual_end_child === void 0 || target.actual_end_child !== null && target.actual_end_child.parentNode !== target) {
      target.actual_end_child = target.firstChild;
    }
    while (target.actual_end_child !== null && target.actual_end_child.claim_order === void 0) {
      target.actual_end_child = target.actual_end_child.nextSibling;
    }
    if (node !== target.actual_end_child) {
      if (node.claim_order !== void 0 || node.parentNode !== target) {
        target.insertBefore(node, target.actual_end_child);
      }
    } else {
      target.actual_end_child = node.nextSibling;
    }
  } else if (node.parentNode !== target || node.nextSibling !== null) {
    target.appendChild(node);
  }
}
function insert_hydration(target, node, anchor) {
  if (is_hydrating && !anchor) {
    append_hydration(target, node);
  } else if (node.parentNode !== target || node.nextSibling != anchor) {
    target.insertBefore(node, anchor || null);
  }
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
function text$1(data) {
  return document.createTextNode(data);
}
function space() {
  return text$1(" ");
}
function empty() {
  return text$1("");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function init_claim_info(nodes) {
  if (nodes.claim_info === void 0) {
    nodes.claim_info = { last_index: 0, total_claimed: 0 };
  }
}
function claim_node(nodes, predicate, processNode, createNode, dontUpdateLastIndex = false) {
  init_claim_info(nodes);
  const resultNode = (() => {
    for (let i = nodes.claim_info.last_index; i < nodes.length; i++) {
      const node = nodes[i];
      if (predicate(node)) {
        const replacement = processNode(node);
        if (replacement === void 0) {
          nodes.splice(i, 1);
        } else {
          nodes[i] = replacement;
        }
        if (!dontUpdateLastIndex) {
          nodes.claim_info.last_index = i;
        }
        return node;
      }
    }
    for (let i = nodes.claim_info.last_index - 1; i >= 0; i--) {
      const node = nodes[i];
      if (predicate(node)) {
        const replacement = processNode(node);
        if (replacement === void 0) {
          nodes.splice(i, 1);
        } else {
          nodes[i] = replacement;
        }
        if (!dontUpdateLastIndex) {
          nodes.claim_info.last_index = i;
        } else if (replacement === void 0) {
          nodes.claim_info.last_index--;
        }
        return node;
      }
    }
    return createNode();
  })();
  resultNode.claim_order = nodes.claim_info.total_claimed;
  nodes.claim_info.total_claimed += 1;
  return resultNode;
}
function claim_element_base(nodes, name, attributes, create_element) {
  return claim_node(nodes, (node) => node.nodeName === name, (node) => {
    const remove = [];
    for (let j = 0; j < node.attributes.length; j++) {
      const attribute = node.attributes[j];
      if (!attributes[attribute.name]) {
        remove.push(attribute.name);
      }
    }
    remove.forEach((v) => node.removeAttribute(v));
    return void 0;
  }, () => create_element(name));
}
function claim_element(nodes, name, attributes) {
  return claim_element_base(nodes, name, attributes, element);
}
function claim_svg_element(nodes, name, attributes) {
  return claim_element_base(nodes, name, attributes, svg_element);
}
function claim_text(nodes, data) {
  return claim_node(
    nodes,
    (node) => node.nodeType === 3,
    (node) => {
      const dataStr = "" + data;
      if (node.data.startsWith(dataStr)) {
        if (node.data.length !== dataStr.length) {
          return node.splitText(dataStr.length);
        }
      } else {
        node.data = dataStr;
      }
    },
    () => text$1(data),
    true
  );
}
function claim_space(nodes) {
  return claim_text(nodes, " ");
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.wholeText !== data)
    text2.data = data;
}
function set_input_value(input, value) {
  input.value = value == null ? "" : value;
}
function set_style(node, key, value, important) {
  if (value === null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
function custom_event(type2, detail, { bubbles = false, cancelable = false } = {}) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type2, bubbles, cancelable, detail);
  return e;
}
const managed_styles = /* @__PURE__ */ new Map();
let active = 0;
function hash(str) {
  let hash2 = 5381;
  let i = str.length;
  while (i--)
    hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
  return hash2 >>> 0;
}
function create_style_information(doc, node) {
  const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
  managed_styles.set(doc, info);
  return info;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
  const step = 16.666 / duration;
  let keyframes = "{\n";
  for (let p = 0; p <= 1; p += step) {
    const t = a + (b - a) * ease(p);
    keyframes += p * 100 + `%{${fn(t, 1 - t)}}
`;
  }
  const rule = keyframes + `100% {${fn(b, 1 - b)}}
}`;
  const name = `__svelte_${hash(rule)}_${uid}`;
  const doc = get_root_for_style(node);
  const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
  if (!rules[name]) {
    rules[name] = true;
    stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  }
  const animation = node.style.animation || "";
  node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay}ms 1 both`;
  active += 1;
  return name;
}
function delete_rule(node, name) {
  const previous = (node.style.animation || "").split(", ");
  const next = previous.filter(
    name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1
  );
  const deleted = previous.length - next.length;
  if (deleted) {
    node.style.animation = next.join(", ");
    active -= deleted;
    if (!active)
      clear_rules();
  }
}
function clear_rules() {
  raf(() => {
    if (active)
      return;
    managed_styles.forEach((info) => {
      const { ownerNode } = info.stylesheet;
      if (ownerNode)
        detach(ownerNode);
    });
    managed_styles.clear();
  });
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type2, detail, { cancelable = false } = {}) => {
    const callbacks = component.$$.callbacks[type2];
    if (callbacks) {
      const event = custom_event(type2, detail, { cancelable });
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
      return !event.defaultPrevented;
    }
    return true;
  };
}
const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
function add_flush_callback(fn) {
  flush_callbacks.push(fn);
}
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  const saved_component = current_component;
  do {
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
let promise;
function wait() {
  if (!promise) {
    promise = Promise.resolve();
    promise.then(() => {
      promise = null;
    });
  }
  return promise;
}
function dispatch(node, direction, kind) {
  node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
}
const outroing = /* @__PURE__ */ new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  } else if (callback) {
    callback();
  }
}
const null_transition = { duration: 0 };
function create_in_transition(node, fn, params) {
  let config = fn(node, params);
  let running = false;
  let animation_name;
  let task;
  let uid = 0;
  function cleanup() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
    tick(0, 1);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    if (task)
      task.abort();
    running = true;
    add_render_callback(() => dispatch(node, true, "start"));
    task = loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick(1, 0);
          dispatch(node, true, "end");
          cleanup();
          return running = false;
        }
        if (now2 >= start_time) {
          const t = easing((now2 - start_time) / duration);
          tick(t, 1 - t);
        }
      }
      return running;
    });
  }
  let started = false;
  return {
    start() {
      if (started)
        return;
      started = true;
      delete_rule(node);
      if (is_function(config)) {
        config = config();
        wait().then(go);
      } else {
        go();
      }
    },
    invalidate() {
      started = false;
    },
    end() {
      if (running) {
        cleanup();
        running = false;
      }
    }
  };
}
function create_out_transition(node, fn, params) {
  let config = fn(node, params);
  let running = true;
  let animation_name;
  const group = outros;
  group.r += 1;
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    add_render_callback(() => dispatch(node, false, "start"));
    loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick(0, 1);
          dispatch(node, false, "end");
          if (!--group.r) {
            run_all(group.c);
          }
          return false;
        }
        if (now2 >= start_time) {
          const t = easing((now2 - start_time) / duration);
          tick(1 - t, t);
        }
      }
      return running;
    });
  }
  if (is_function(config)) {
    wait().then(() => {
      config = config();
      go();
    });
  } else {
    go();
  }
  return {
    end(reset) {
      if (reset && config.tick) {
        config.tick(1, 0);
      }
      if (running) {
        if (animation_name)
          delete_rule(node, animation_name);
        running = false;
      }
    }
  };
}
function bind(component, name, callback) {
  const index = component.$$.props[name];
  if (index !== void 0) {
    component.$$.bound[index] = callback;
    callback(component.$$.ctx[index]);
  }
}
function create_component(block) {
  block && block.c();
}
function claim_component(block, parent_nodes) {
  block && block.l(parent_nodes);
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
      if (component.$$.on_destroy) {
        component.$$.on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      start_hydrating();
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    end_hydrating();
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type2, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type2] || (this.$$.callbacks[type2] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
const types = ["ad", "sub", "webmon"];
const type = "webmon";
const apiKey = "djE";
const themes = ["light", "dark", "accent"];
const variants = ["center", "bottom"];
const theme = "light";
const variant = "center";
const subtitle = "The news you need, when you need it!";
const heading = (type2) => {
  return {
    ad: "Read more with Ads",
    sub: "Read more with Subscription",
    webmon: "Read more with Web Monetization"
  }[type2];
};
const href = "#learn-more";
const ctaText = "Purchase";
const text = (type2) => {
  return {
    ad: `Our journalism is supported by readers like you.`,
    sub: `Our journalism is supported by readers like you.`,
    webmon: `Our journalism is supported by readers like you. Web Monetization sends money to us when you read, enabling us to report out the news you need. We call that a win-win.`
  }[type2];
};
const getProps = (type2) => {
  return {
    subtitle,
    heading: heading(type2),
    href,
    ctaText,
    text: text(type2)
  };
};
var defaults = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  apiKey,
  themes,
  variants,
  theme,
  variant,
  subtitle,
  heading,
  href,
  ctaText,
  text,
  getProps,
  type,
  types
}, Symbol.toStringTag, { value: "Module" }));
function create_if_block_1$2(ctx) {
  let svg;
  let path0;
  let path1;
  let path2;
  let path3;
  let circle;
  let path4;
  let path5;
  let path6;
  let svg_class_value;
  return {
    c() {
      svg = svg_element("svg");
      path0 = svg_element("path");
      path1 = svg_element("path");
      path2 = svg_element("path");
      path3 = svg_element("path");
      circle = svg_element("circle");
      path4 = svg_element("path");
      path5 = svg_element("path");
      path6 = svg_element("path");
      this.h();
    },
    l(nodes) {
      svg = claim_svg_element(nodes, "svg", {
        "aria-hidden": true,
        xmlns: true,
        class: true,
        viewBox: true,
        x: true,
        y: true,
        width: true,
        height: true
      });
      var svg_nodes = children(svg);
      path0 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path0).forEach(detach);
      path1 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path1).forEach(detach);
      path2 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path2).forEach(detach);
      path3 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path3).forEach(detach);
      circle = claim_svg_element(svg_nodes, "circle", { fill: true, cx: true, cy: true, r: true });
      children(circle).forEach(detach);
      path4 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path4).forEach(detach);
      path5 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path5).forEach(detach);
      path6 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path6).forEach(detach);
      svg_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(path0, "fill", "#C1CDD5");
      attr(path0, "d", "M36 19.854C33.518 9.923 25.006 1.909 16.031 6.832c0 0-4.522-1.496-5.174-1.948-.635-.44-1.635-.904-.912.436.423.782.875 1.672 2.403 3.317C8 12.958 9.279 18.262 7.743 21.75c-1.304 2.962-2.577 4.733-1.31 6.976 1.317 2.33 4.729 3.462 7.018 1.06 1.244-1.307.471-1.937 3.132-4.202 2.723-.543 4.394-1.791 4.394-4.375 0 0 .795-.382 1.826 6.009.456 2.818-.157 5.632-.039 8.783H36V19.854z");
      attr(path1, "fill", "#60379A");
      attr(path1, "d", "M31.906 6.062c.531 1.312.848 3.71.595 5.318-.15-3.923-3.188-6.581-4.376-7.193-2.202-1.137-4.372-.979-6.799-.772.111.168.403.814.32 1.547-.479-.875-1.604-1.42-2.333-1.271-1.36.277-2.561.677-3.475 1.156-.504.102-1.249.413-2.372 1.101-1.911 1.171-4.175 4.338-6.737 3.511 1.042 2.5 3.631 1.845 3.631 1.845 1.207-1.95 4.067-3.779 6.168-4.452 7.619-1.745 12.614 3.439 15.431 9.398.768 1.625 2.611 7.132 4.041 10.292V10.956c-.749-1.038-1.281-3.018-4.094-4.894z");
      attr(path2, "fill", "#C1CDD5");
      attr(path2, "d", "M13.789 3.662c.573.788 3.236.794 4.596 3.82 1.359 3.026-1.943 2.63-3.14 1.23-1.334-1.561-1.931-2.863-2.165-3.992-.124-.596-.451-2.649.709-1.058z");
      attr(path3, "fill", "#758795");
      attr(path3, "d", "M14.209 4.962c.956.573 2.164 1.515 2.517 2.596.351 1.081-.707.891-1.349-.042-.641-.934-.94-1.975-1.285-2.263-.346-.289.117-.291.117-.291z");
      attr(circle, "fill", "#292F33");
      attr(circle, "cx", "15.255");
      attr(circle, "cy", "14.565");
      attr(circle, "r", ".946");
      attr(path4, "fill", "#53626C");
      attr(path4, "d", "M8.63 26.877c.119.658-.181 1.263-.67 1.351-.49.089-.984-.372-1.104-1.03-.119-.659.182-1.265.671-1.354.49-.088.984.373 1.103 1.033z");
      attr(path5, "fill", "#EE7C0E");
      attr(path5, "d", "M13.844 8.124l.003-.002-.005-.007-.016-.014c-.008-.007-.011-.019-.019-.025-.009-.007-.021-.011-.031-.018C12.621 7.078.933-.495.219.219-.51.948 10.443 9.742 11.149 10.28l.011.006.541.439c.008.007.01.018.018.024.013.01.028.015.042.024l.047.038-.009-.016c.565.361 1.427.114 1.979-.592.559-.715.577-1.625.066-2.079z");
      attr(path6, "fill", "#C43512");
      attr(path6, "d", "M4.677 2.25l.009-.025c-.301-.174-.594-.341-.878-.5-.016.038-.022.069-.041.11-.112.243-.256.484-.429.716-.166.224-.349.424-.541.595-.02.018-.036.026-.056.043.238.22.489.446.745.676.234-.21.456-.449.654-.717.214-.287.395-.589.537-.898zm2.275 2.945c.306-.41.521-.822.66-1.212-.292-.181-.584-.36-.876-.538-.076.298-.247.699-.586 1.152-.31.417-.613.681-.864.845.259.223.52.445.779.665.314-.244.619-.552.887-.912zM9.87 7.32c.365-.49.609-.983.734-1.437l-.906-.586c-.023.296-.172.81-.631 1.425-.412.554-.821.847-1.1.978l.814.671c.381-.256.761-.611 1.089-1.051z");
      attr(svg, "aria-hidden", "true");
      attr(svg, "xmlns", "http://www.w3.org/2000/svg");
      attr(svg, "class", svg_class_value = "pointer-events-none " + ctx[1]);
      attr(svg, "viewBox", "0 0 36 36");
      attr(svg, "x", ctx[2]);
      attr(svg, "y", ctx[3]);
      attr(svg, "width", ctx[4]);
      attr(svg, "height", ctx[5]);
    },
    m(target, anchor) {
      insert_hydration(target, svg, anchor);
      append_hydration(svg, path0);
      append_hydration(svg, path1);
      append_hydration(svg, path2);
      append_hydration(svg, path3);
      append_hydration(svg, circle);
      append_hydration(svg, path4);
      append_hydration(svg, path5);
      append_hydration(svg, path6);
    },
    p(ctx2, dirty) {
      if (dirty & 2 && svg_class_value !== (svg_class_value = "pointer-events-none " + ctx2[1])) {
        attr(svg, "class", svg_class_value);
      }
      if (dirty & 4) {
        attr(svg, "x", ctx2[2]);
      }
      if (dirty & 8) {
        attr(svg, "y", ctx2[3]);
      }
      if (dirty & 16) {
        attr(svg, "width", ctx2[4]);
      }
      if (dirty & 32) {
        attr(svg, "height", ctx2[5]);
      }
    },
    d(detaching) {
      if (detaching)
        detach(svg);
    }
  };
}
function create_if_block$2(ctx) {
  let svg;
  let path0;
  let path1;
  let path2;
  let path3;
  let path4;
  let path5;
  let path6;
  let path7;
  let path8;
  let path9;
  let path10;
  let path11;
  let path12;
  let svg_class_value;
  return {
    c() {
      svg = svg_element("svg");
      path0 = svg_element("path");
      path1 = svg_element("path");
      path2 = svg_element("path");
      path3 = svg_element("path");
      path4 = svg_element("path");
      path5 = svg_element("path");
      path6 = svg_element("path");
      path7 = svg_element("path");
      path8 = svg_element("path");
      path9 = svg_element("path");
      path10 = svg_element("path");
      path11 = svg_element("path");
      path12 = svg_element("path");
      this.h();
    },
    l(nodes) {
      svg = claim_svg_element(nodes, "svg", {
        "aria-hidden": true,
        xmlns: true,
        class: true,
        viewBox: true,
        x: true,
        y: true,
        width: true,
        height: true
      });
      var svg_nodes = children(svg);
      path0 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path0).forEach(detach);
      path1 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path1).forEach(detach);
      path2 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path2).forEach(detach);
      path3 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path3).forEach(detach);
      path4 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path4).forEach(detach);
      path5 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path5).forEach(detach);
      path6 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path6).forEach(detach);
      path7 = claim_svg_element(svg_nodes, "path", { fill: true, d: true });
      children(path7).forEach(detach);
      path8 = claim_svg_element(svg_nodes, "path", { d: true, fill: true });
      children(path8).forEach(detach);
      path9 = claim_svg_element(svg_nodes, "path", { d: true, fill: true });
      children(path9).forEach(detach);
      path10 = claim_svg_element(svg_nodes, "path", { d: true, fill: true });
      children(path10).forEach(detach);
      path11 = claim_svg_element(svg_nodes, "path", { d: true, fill: true });
      children(path11).forEach(detach);
      path12 = claim_svg_element(svg_nodes, "path", { d: true, fill: true });
      children(path12).forEach(detach);
      svg_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(path0, "fill", "#898379");
      attr(path0, "d", "M6 23c-4 0-4.5 2.5-4.5 2.5L0 25v11h36V25l-1 1s-1-3-4-3H6z");
      attr(path1, "fill", "#394150");
      attr(path1, "d", "M34.712 11.129C32.343 4.839 25.009 3.077 18 3.077c-.15 0-.285.006-.432.007-.77-.018-5.121-.148-7.939-.897A.498.498 0 0 0 9 2.67V4s-4.126-.688-6.676-1.493a.501.501 0 0 0-.579.734l2.14 3.567C.736 10.28 3 15.31 3 18c0 8 3 8 3 8h23c3.497 0 4-4.503 4-8 0-1.451.599-2.767.137-5.338a.93.93 0 0 1 1.15-1.063.358.358 0 0 0 .425-.47z");
      attr(path2, "fill", "#69615D");
      attr(path2, "d", "M9 29c-.155 0-.309.036-.447.105C5.602 30.581 5.038 35.898 5 36h26c-.038-.102-.602-5.419-3.553-6.895A1.002 1.002 0 0 0 27 29H9z");
      attr(path3, "fill", "#A6D388");
      attr(path3, "d", "M9 30c-1.148.574-1.307 1.806-1.235 2.752a5.396 5.396 0 0 1-.551 2.821L7 36h22l-.214-.427a5.396 5.396 0 0 1-.551-2.821c.072-.946-.087-2.178-1.235-2.752H9z");
      attr(path4, "fill", "#77B255");
      attr(path4, "d", "M17.946 33.923c4.734 0 8.014-.675 10.285-1.886-.062-.783-.357-1.6-1.231-2.037H9c-.86.43-1.16 1.229-1.228 2.001 2.365 1.304 5.675 1.922 10.174 1.922z");
      attr(path5, "fill", "#A6D388");
      attr(path5, "d", "M24.354 14.222c1.045.385 2.045 1.714 2.175 2.448.13.735.261 1.329-.565.594-3.312-2.942-6.919-1.783-10.495-3.581-2.497-1.255-3.257-2.644-3.257-2.644s-.305 1.853-4.091 3.741c-1.46.729-3.122.443-3.122 3.22 0 7.483-1.258 13.923 12.947 13.923 11.26 0 12.87-3.814 13.054-9.121.003-3.604-.463-5.009-1.598-6.272-.992-1.105-2.263-1.993-5.048-2.308z");
      attr(path6, "fill", "#77B255");
      attr(path6, "d", "M20 24h-4a1 1 0 0 1 0-2h4a1 1 0 0 1 0 2z");
      attr(path7, "fill", "#744629");
      attr(path7, "d", "M23 28H13a1 1 0 0 1 0-2h10a1 1 0 0 1 0 2z");
      attr(path8, "d", "M15 16h-4a1 1 0 0 0 0 2h1v2a1 1 0 1 0 2 0v-2h1a1 1 0 0 0 0-2zm10 0h-4a1 1 0 0 0 0 2h1v2a1 1 0 1 0 2 0v-2h1a1 1 0 0 0 0-2z");
      attr(path8, "fill", "#2FA875");
      attr(path9, "d", "M31 13c2 2 2 5 2 5l3-5s-2-2-5 0zM5 13c-2 2-2 5-2 5l-3-5s2-2 5 0z");
      attr(path9, "fill", "#A6D388");
      attr(path10, "d", "M.983 30.656a.1.1 0 0 1-.116.028.1.1 0 0 1-.06-.104c.095-.792.452-2.923 1.623-4.209a.1.1 0 0 1 .174.061c.129 1.932-1.116 3.623-1.621 4.224zM.95 33.678c-.01.038.004.079.035.104s.074.028.109.009c.462-.248.983-.784 1.221-1.485.289-.853.269-1.434.226-1.723a.102.102 0 0 0-.073-.082.1.1 0 0 0-.104.034 6.14 6.14 0 0 0-.794 1.279c-.299.655-.521 1.485-.62 1.864zm3.594-7.465a.1.1 0 0 0-.07-.085.097.097 0 0 0-.105.031c-.758.89-.897 2.264-.922 2.817a.1.1 0 0 0 .173.074 3.532 3.532 0 0 0 .924-2.837zm1.169 3.024a.1.1 0 0 0-.06-.108.1.1 0 0 0-.119.033c-.951 1.296-2.363 4.513-2.831 5.606a.1.1 0 0 0 .033.12.1.1 0 0 0 .124-.004c.515-.44 1.532-1.404 2.012-2.528.483-1.135.739-2.485.841-3.119zm24.448.423a.101.101 0 0 0-.114-.005.1.1 0 0 0-.044.105c.23 1.084.886 2.467 1.942 3.3a.1.1 0 0 0 .114.007.1.1 0 0 0 .046-.105c-.121-.615-.559-2.244-1.944-3.302zm4.729 4.28a.1.1 0 0 0 .145-.119c-.235-.677-1.032-2.6-2.692-3.283a.097.097 0 0 0-.104.018.1.1 0 0 0-.03.102c.525 1.879 2.097 2.943 2.681 3.282zm-.695-3.493a.1.1 0 0 0 .128-.127c-.374-1.05-1.476-2.639-2.95-3.014a.1.1 0 0 0-.12.126c.629 2.025 2.365 2.806 2.942 3.015zm.763-1.791a.1.1 0 0 0 .16-.102c-.263-1.09-1.298-2.795-2.646-3.282a.1.1 0 0 0-.105.024.102.102 0 0 0-.023.105c.552 1.499 2.058 2.809 2.614 3.255z");
      attr(path10, "fill", "#69615D");
      attr(path11, "d", "M31.505 13.587c.638-.509 1.681-.932 3.117-.571a.5.5 0 1 1-.244.97c-1.224-.309-1.959.114-2.327.447a6.29 6.29 0 0 0-.546-.846zm-27.01-.001c-.637-.509-1.68-.932-3.117-.571a.5.5 0 1 0 .244.97c1.225-.308 1.959.115 2.327.446a6.41 6.41 0 0 1 .546-.845z");
      attr(path11, "fill", "#77B255");
      attr(path12, "d", "M13 27v-2s2 .667 2 2h-2zm10 0v-2s-2 .667-2 2h2z");
      attr(path12, "fill", "#FFEBA5");
      attr(svg, "aria-hidden", "true");
      attr(svg, "xmlns", "http://www.w3.org/2000/svg");
      attr(svg, "class", svg_class_value = "pointer-events-none " + ctx[1]);
      attr(svg, "viewBox", "0 0 36 36");
      attr(svg, "x", ctx[2]);
      attr(svg, "y", ctx[3]);
      attr(svg, "width", ctx[4]);
      attr(svg, "height", ctx[5]);
    },
    m(target, anchor) {
      insert_hydration(target, svg, anchor);
      append_hydration(svg, path0);
      append_hydration(svg, path1);
      append_hydration(svg, path2);
      append_hydration(svg, path3);
      append_hydration(svg, path4);
      append_hydration(svg, path5);
      append_hydration(svg, path6);
      append_hydration(svg, path7);
      append_hydration(svg, path8);
      append_hydration(svg, path9);
      append_hydration(svg, path10);
      append_hydration(svg, path11);
      append_hydration(svg, path12);
    },
    p(ctx2, dirty) {
      if (dirty & 2 && svg_class_value !== (svg_class_value = "pointer-events-none " + ctx2[1])) {
        attr(svg, "class", svg_class_value);
      }
      if (dirty & 4) {
        attr(svg, "x", ctx2[2]);
      }
      if (dirty & 8) {
        attr(svg, "y", ctx2[3]);
      }
      if (dirty & 16) {
        attr(svg, "width", ctx2[4]);
      }
      if (dirty & 32) {
        attr(svg, "height", ctx2[5]);
      }
    },
    d(detaching) {
      if (detaching)
        detach(svg);
    }
  };
}
function create_fragment$2(ctx) {
  let if_block_anchor;
  function select_block_type(ctx2, dirty) {
    if (ctx2[0] === "fairpass/troll")
      return create_if_block$2;
    if (ctx2[0] === "fairpass/unicorn")
      return create_if_block_1$2;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type && current_block_type(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    l(nodes) {
      if (if_block)
        if_block.l(nodes);
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert_hydration(target, if_block_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if (if_block)
          if_block.d(1);
        if_block = current_block_type && current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (if_block) {
        if_block.d(detaching);
      }
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function instance$2($$self, $$props, $$invalidate) {
  let { name } = $$props;
  let { class: klass = "w-4 h-4" } = $$props;
  let { x = 0 } = $$props;
  let { y = 0 } = $$props;
  let { width = "100%" } = $$props;
  let { height = "100%" } = $$props;
  $$self.$$set = ($$props2) => {
    if ("name" in $$props2)
      $$invalidate(0, name = $$props2.name);
    if ("class" in $$props2)
      $$invalidate(1, klass = $$props2.class);
    if ("x" in $$props2)
      $$invalidate(2, x = $$props2.x);
    if ("y" in $$props2)
      $$invalidate(3, y = $$props2.y);
    if ("width" in $$props2)
      $$invalidate(4, width = $$props2.width);
    if ("height" in $$props2)
      $$invalidate(5, height = $$props2.height);
  };
  return [name, klass, x, y, width, height];
}
class FairPassIcon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$2, create_fragment$2, safe_not_equal, {
      name: 0,
      class: 1,
      x: 2,
      y: 3,
      width: 4,
      height: 5
    });
  }
}
const shaWorkerCode = `

async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder('utf-8').encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function findMatch({type, nonce, scope = 'global'}) {

  if (type !== 'sha256') {
    return;
  }

  let prefix = "000";
  nonce = nonce || Math.random().toString(36).substr(2, 10);

  let counter = 0;
  let start = performance.now();
  let now = Date.now();
  let resulthash = new String('');
  let found = false;
  while (!found && counter < 99999) {
    counter++;
    resulthash = await sha256(\`\${scope}:\${nonce}:\${now}:\${counter}\`);
    found = resulthash.startsWith(prefix);
  }
  var duration = performance.now() - start;
  var result = {
    nonce: nonce,
    counter: counter,
    duration: duration,
    scope,
    now,
    hash: resulthash
  };
  return result;
}
var self = this;
self.addEventListener('message', async function (e) {
    const src = e.data;
    const result = await findMatch(src);
    console.log('hash', result, e);
    self.postMessage({type: 'sha256', ...src, ...result});
}, false); 
`;
const shaWorker = () => {
  let worker;
  try {
    const blob = new Blob([shaWorkerCode], { type: "text/javascript" });
    const url = window.URL.createObjectURL(blob);
    worker = new Worker(url);
  } catch (e) {
    console.log(e);
    throw new Error("Failed to create sha");
  }
  return worker;
};
function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
  const o = +getComputedStyle(node).opacity;
  return {
    delay,
    duration,
    easing,
    css: (t) => `opacity: ${t * o}`
  };
}
function create_else_block_3(ctx) {
  let t;
  return {
    c() {
      t = text$1("\xA0");
    },
    l(nodes) {
      t = claim_text(nodes, "\xA0");
    },
    m(target, anchor) {
      insert_hydration(target, t, anchor);
    },
    p: noop,
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_if_block_5(ctx) {
  let div10;
  let div0;
  let t0;
  let div9;
  let div8;
  let div1;
  let fairpassicon;
  let t1;
  let p0;
  let span0;
  let t2;
  let t3;
  let span1;
  let t4;
  let t5;
  let h2;
  let span2;
  let t6;
  let t7;
  let t8;
  let div7;
  let div3;
  let p1;
  let t9;
  let a0;
  let t10;
  let t11;
  let t12;
  let div2;
  let a1;
  let span3;
  let t13;
  let t14;
  let div4;
  let a2;
  let t15;
  let t16;
  let div6;
  let label;
  let t17;
  let t18;
  let div5;
  let input;
  let t19;
  let p2;
  let t20;
  let t21;
  let button;
  let span4;
  let current;
  let mounted;
  let dispose;
  fairpassicon = new FairPassIcon({
    props: {
      class: "h-12 w-12 rounded-full bg-[#88837A] p-1 ring-2 ring-white",
      name: "fairpass/troll"
    }
  });
  function select_block_type_3(ctx2, dirty) {
    if (ctx2[2])
      return create_if_block_6;
    return create_else_block_2;
  }
  let current_block_type = select_block_type_3(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div10 = element("div");
      div0 = element("div");
      t0 = space();
      div9 = element("div");
      div8 = element("div");
      div1 = element("div");
      create_component(fairpassicon.$$.fragment);
      t1 = space();
      p0 = element("p");
      span0 = element("span");
      t2 = text$1("Membership Is Required for this Content");
      t3 = space();
      span1 = element("span");
      t4 = text$1("Member Required");
      t5 = space();
      h2 = element("h2");
      span2 = element("span");
      t6 = text$1("Let's");
      t7 = text$1("\n            Get More from the Web");
      t8 = space();
      div7 = element("div");
      div3 = element("div");
      p1 = element("p");
      t9 = text$1("It's free to join the ");
      a0 = element("a");
      t10 = text$1("Fair Pass");
      t11 = text$1(" content collective and get access to this content and other member\n              sites. Fair Pass helps grow the web by helping to monetize your favorite\n              sites. As long as members represent a minimum threshold of traffic,\n              a site is free. Your contribution unlocks this site for you and others.");
      t12 = space();
      div2 = element("div");
      a1 = element("a");
      span3 = element("span");
      t13 = text$1("Learn more");
      t14 = space();
      div4 = element("div");
      a2 = element("a");
      t15 = text$1("Learn more");
      t16 = space();
      div6 = element("div");
      label = element("label");
      t17 = text$1("Your Email");
      t18 = space();
      div5 = element("div");
      input = element("input");
      t19 = space();
      p2 = element("p");
      t20 = text$1("Joining gives you immediate access. We'll also send an email with\n              ways you can support good content. Unsubscribe at any time.");
      t21 = space();
      button = element("button");
      span4 = element("span");
      if_block.c();
      this.h();
    },
    l(nodes) {
      div10 = claim_element(nodes, "DIV", { class: true });
      var div10_nodes = children(div10);
      div0 = claim_element(div10_nodes, "DIV", { class: true });
      children(div0).forEach(detach);
      t0 = claim_space(div10_nodes);
      div9 = claim_element(div10_nodes, "DIV", { class: true });
      var div9_nodes = children(div9);
      div8 = claim_element(div9_nodes, "DIV", { class: true });
      var div8_nodes = children(div8);
      div1 = claim_element(div8_nodes, "DIV", { class: true });
      var div1_nodes = children(div1);
      claim_component(fairpassicon.$$.fragment, div1_nodes);
      t1 = claim_space(div1_nodes);
      p0 = claim_element(div1_nodes, "P", { class: true });
      var p0_nodes = children(p0);
      span0 = claim_element(p0_nodes, "SPAN", { class: true });
      var span0_nodes = children(span0);
      t2 = claim_text(span0_nodes, "Membership Is Required for this Content");
      span0_nodes.forEach(detach);
      t3 = claim_space(p0_nodes);
      span1 = claim_element(p0_nodes, "SPAN", { class: true });
      var span1_nodes = children(span1);
      t4 = claim_text(span1_nodes, "Member Required");
      span1_nodes.forEach(detach);
      p0_nodes.forEach(detach);
      t5 = claim_space(div1_nodes);
      h2 = claim_element(div1_nodes, "H2", { class: true, id: true });
      var h2_nodes = children(h2);
      span2 = claim_element(h2_nodes, "SPAN", { class: true });
      var span2_nodes = children(span2);
      t6 = claim_text(span2_nodes, "Let's");
      span2_nodes.forEach(detach);
      t7 = claim_text(h2_nodes, "\n            Get More from the Web");
      h2_nodes.forEach(detach);
      div1_nodes.forEach(detach);
      t8 = claim_space(div8_nodes);
      div7 = claim_element(div8_nodes, "DIV", {});
      var div7_nodes = children(div7);
      div3 = claim_element(div7_nodes, "DIV", { class: true });
      var div3_nodes = children(div3);
      p1 = claim_element(div3_nodes, "P", { class: true });
      var p1_nodes = children(p1);
      t9 = claim_text(p1_nodes, "It's free to join the ");
      a0 = claim_element(p1_nodes, "A", {
        target: true,
        rel: true,
        class: true,
        href: true
      });
      var a0_nodes = children(a0);
      t10 = claim_text(a0_nodes, "Fair Pass");
      a0_nodes.forEach(detach);
      t11 = claim_text(p1_nodes, " content collective and get access to this content and other member\n              sites. Fair Pass helps grow the web by helping to monetize your favorite\n              sites. As long as members represent a minimum threshold of traffic,\n              a site is free. Your contribution unlocks this site for you and others.");
      p1_nodes.forEach(detach);
      t12 = claim_space(div3_nodes);
      div2 = claim_element(div3_nodes, "DIV", { class: true });
      var div2_nodes = children(div2);
      a1 = claim_element(div2_nodes, "A", { href: true, class: true });
      var a1_nodes = children(a1);
      span3 = claim_element(a1_nodes, "SPAN", { class: true });
      var span3_nodes = children(span3);
      t13 = claim_text(span3_nodes, "Learn more");
      span3_nodes.forEach(detach);
      a1_nodes.forEach(detach);
      div2_nodes.forEach(detach);
      div3_nodes.forEach(detach);
      t14 = claim_space(div7_nodes);
      div4 = claim_element(div7_nodes, "DIV", { class: true });
      var div4_nodes = children(div4);
      a2 = claim_element(div4_nodes, "A", { href: true, class: true });
      var a2_nodes = children(a2);
      t15 = claim_text(a2_nodes, "Learn more");
      a2_nodes.forEach(detach);
      div4_nodes.forEach(detach);
      t16 = claim_space(div7_nodes);
      div6 = claim_element(div7_nodes, "DIV", { class: true });
      var div6_nodes = children(div6);
      label = claim_element(div6_nodes, "LABEL", { for: true, class: true });
      var label_nodes = children(label);
      t17 = claim_text(label_nodes, "Your Email");
      label_nodes.forEach(detach);
      t18 = claim_space(div6_nodes);
      div5 = claim_element(div6_nodes, "DIV", { class: true });
      var div5_nodes = children(div5);
      input = claim_element(div5_nodes, "INPUT", {
        type: true,
        name: true,
        id: true,
        class: true,
        placeholder: true
      });
      div5_nodes.forEach(detach);
      t19 = claim_space(div6_nodes);
      p2 = claim_element(div6_nodes, "P", { class: true });
      var p2_nodes = children(p2);
      t20 = claim_text(p2_nodes, "Joining gives you immediate access. We'll also send an email with\n              ways you can support good content. Unsubscribe at any time.");
      p2_nodes.forEach(detach);
      div6_nodes.forEach(detach);
      div7_nodes.forEach(detach);
      div8_nodes.forEach(detach);
      t21 = claim_space(div9_nodes);
      button = claim_element(div9_nodes, "BUTTON", { class: true, target: true, rel: true });
      var button_nodes = children(button);
      span4 = claim_element(button_nodes, "SPAN", { class: true });
      var span4_nodes = children(span4);
      if_block.l(span4_nodes);
      span4_nodes.forEach(detach);
      button_nodes.forEach(detach);
      div9_nodes.forEach(detach);
      div10_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div0, "class", "h-4 w-11/12 rounded-t-3xl bg-cyan-100 md:h-6");
      attr(span0, "class", "hidden md:block");
      attr(span1, "class", "block md:hidden");
      attr(p0, "class", "m-0 mb-1 text-sm font-semibold uppercase tracking-tighter text-cyan-500");
      attr(span2, "class", "hidden md:inline-block");
      attr(h2, "class", "m-0 mb-1 text-2xl font-extrabold leading-none text-gray-800 md:my-2 xl:text-3xl xl:leading-none");
      attr(h2, "id", "modal-headline");
      attr(div1, "class", "px-3 sm:px-5 md:px-10");
      attr(a0, "target", "_blank");
      attr(a0, "rel", "noreferrer");
      attr(a0, "class", "text-gray-500 underline-offset-1");
      attr(a0, "href", "https://www.fairpass.co/?utm_src=barrier");
      attr(p1, "class", "max-w-prose-78 my-2 ml-2 px-3 text-base leading-tight sm:px-5 md:px-10 lg:text-lg lg:leading-snug");
      attr(span3, "class", "h-6 text-white");
      attr(a1, "href", "https://www.fairpass.co/?utm_src=barrier-learn-more");
      attr(a1, "class", "flex flex-col items-center rounded-l-3xl bg-cyan-800 py-3 px-5 text-white xl:p-6");
      attr(div2, "class", "hidden flex-shrink-0 -translate-y-1/2 self-center text-center md:block");
      attr(div3, "class", "flex justify-between");
      attr(a2, "href", "https://www.fairpass.co/?utm_src=barrier-learn-more");
      attr(a2, "class", "inline-block text-cyan-500 underline");
      attr(div4, "class", "block px-3 sm:px-5 md:hidden");
      attr(label, "for", "email");
      attr(label, "class", "block text-sm font-bold text-gray-700");
      attr(input, "type", "email");
      attr(input, "name", "email");
      attr(input, "id", "fp-email");
      attr(input, "class", "w-full rounded border-gray-300 bg-cyan-50 text-black shadow-sm focus:border-gray-300 focus:ring-gray-500 sm:text-sm");
      attr(input, "placeholder", "you@example.com");
      attr(div5, "class", "mt-1 flex");
      attr(p2, "class", "text-sm text-gray-500");
      attr(div6, "class", "px-3 py-3 sm:px-5 md:px-10 md:py-5");
      attr(div8, "class", "box-border w-full pt-6 sm:pt-6 md:pt-8");
      attr(span4, "class", "flex items-center justify-center gap-2");
      attr(button, "class", "inline-block w-full cursor-pointer rounded-3xl rounded-tl-none rounded-tr-none border-none bg-cyan-500 py-2 text-center text-sm leading-tight text-white no-underline hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-50 sm:text-base md:py-3");
      button.disabled = ctx[2];
      attr(button, "target", "_blank");
      attr(button, "rel", "noreferrer");
      attr(div9, "class", "shadow-xl-all focus-within:shadow-xl-all-darker w-full rounded-3xl rounded-tl-none bg-white font-sans text-gray-800");
      attr(div10, "class", "box-border w-screen max-w-2xl p-4 xl:p-0");
    },
    m(target, anchor) {
      insert_hydration(target, div10, anchor);
      append_hydration(div10, div0);
      append_hydration(div10, t0);
      append_hydration(div10, div9);
      append_hydration(div9, div8);
      append_hydration(div8, div1);
      mount_component(fairpassicon, div1, null);
      append_hydration(div1, t1);
      append_hydration(div1, p0);
      append_hydration(p0, span0);
      append_hydration(span0, t2);
      append_hydration(p0, t3);
      append_hydration(p0, span1);
      append_hydration(span1, t4);
      append_hydration(div1, t5);
      append_hydration(div1, h2);
      append_hydration(h2, span2);
      append_hydration(span2, t6);
      append_hydration(h2, t7);
      append_hydration(div8, t8);
      append_hydration(div8, div7);
      append_hydration(div7, div3);
      append_hydration(div3, p1);
      append_hydration(p1, t9);
      append_hydration(p1, a0);
      append_hydration(a0, t10);
      append_hydration(p1, t11);
      append_hydration(div3, t12);
      append_hydration(div3, div2);
      append_hydration(div2, a1);
      append_hydration(a1, span3);
      append_hydration(span3, t13);
      append_hydration(div7, t14);
      append_hydration(div7, div4);
      append_hydration(div4, a2);
      append_hydration(a2, t15);
      append_hydration(div7, t16);
      append_hydration(div7, div6);
      append_hydration(div6, label);
      append_hydration(label, t17);
      append_hydration(div6, t18);
      append_hydration(div6, div5);
      append_hydration(div5, input);
      set_input_value(input, ctx[1]);
      append_hydration(div6, t19);
      append_hydration(div6, p2);
      append_hydration(p2, t20);
      append_hydration(div9, t21);
      append_hydration(div9, button);
      append_hydration(button, span4);
      if_block.m(span4, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(input, "input", ctx[9]),
          listen(input, "keydown", ctx[10]),
          listen(button, "click", ctx[5])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 2 && input.value !== ctx2[1]) {
        set_input_value(input, ctx2[1]);
      }
      if (current_block_type !== (current_block_type = select_block_type_3(ctx2))) {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(span4, null);
        }
      }
      if (!current || dirty & 4) {
        button.disabled = ctx2[2];
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(fairpassicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(fairpassicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div10);
      destroy_component(fairpassicon);
      if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_3(ctx) {
  let div7;
  let div0;
  let t0;
  let div6;
  let div5;
  let div1;
  let fairpassicon;
  let t1;
  let p0;
  let span0;
  let t2;
  let t3;
  let span1;
  let t4;
  let t5;
  let h2;
  let t6;
  let t7;
  let div4;
  let div2;
  let p1;
  let t8;
  let div3;
  let a;
  let t9;
  let t10;
  let button;
  let span2;
  let current;
  let mounted;
  let dispose;
  fairpassicon = new FairPassIcon({
    props: {
      class: "h-12 w-12 rounded-full bg-[#88837A] p-1 ring-2 ring-white",
      name: "fairpass/troll"
    }
  });
  function select_block_type_2(ctx2, dirty) {
    if (ctx2[2])
      return create_if_block_4;
    return create_else_block_1;
  }
  let current_block_type = select_block_type_2(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div7 = element("div");
      div0 = element("div");
      t0 = space();
      div6 = element("div");
      div5 = element("div");
      div1 = element("div");
      create_component(fairpassicon.$$.fragment);
      t1 = space();
      p0 = element("p");
      span0 = element("span");
      t2 = text$1("Welcome");
      t3 = space();
      span1 = element("span");
      t4 = text$1("Welcome");
      t5 = space();
      h2 = element("h2");
      t6 = text$1("Check your email for a verification link");
      t7 = space();
      div4 = element("div");
      div2 = element("div");
      p1 = element("p");
      t8 = space();
      div3 = element("div");
      a = element("a");
      t9 = text$1("Learn more");
      t10 = space();
      button = element("button");
      span2 = element("span");
      if_block.c();
      this.h();
    },
    l(nodes) {
      div7 = claim_element(nodes, "DIV", { class: true });
      var div7_nodes = children(div7);
      div0 = claim_element(div7_nodes, "DIV", { class: true });
      children(div0).forEach(detach);
      t0 = claim_space(div7_nodes);
      div6 = claim_element(div7_nodes, "DIV", { class: true });
      var div6_nodes = children(div6);
      div5 = claim_element(div6_nodes, "DIV", { class: true });
      var div5_nodes = children(div5);
      div1 = claim_element(div5_nodes, "DIV", { class: true });
      var div1_nodes = children(div1);
      claim_component(fairpassicon.$$.fragment, div1_nodes);
      t1 = claim_space(div1_nodes);
      p0 = claim_element(div1_nodes, "P", { class: true });
      var p0_nodes = children(p0);
      span0 = claim_element(p0_nodes, "SPAN", { class: true });
      var span0_nodes = children(span0);
      t2 = claim_text(span0_nodes, "Welcome");
      span0_nodes.forEach(detach);
      t3 = claim_space(p0_nodes);
      span1 = claim_element(p0_nodes, "SPAN", { class: true });
      var span1_nodes = children(span1);
      t4 = claim_text(span1_nodes, "Welcome");
      span1_nodes.forEach(detach);
      p0_nodes.forEach(detach);
      t5 = claim_space(div1_nodes);
      h2 = claim_element(div1_nodes, "H2", { class: true, id: true });
      var h2_nodes = children(h2);
      t6 = claim_text(h2_nodes, "Check your email for a verification link");
      h2_nodes.forEach(detach);
      div1_nodes.forEach(detach);
      t7 = claim_space(div5_nodes);
      div4 = claim_element(div5_nodes, "DIV", {});
      var div4_nodes = children(div4);
      div2 = claim_element(div4_nodes, "DIV", { class: true });
      var div2_nodes = children(div2);
      p1 = claim_element(div2_nodes, "P", { class: true });
      children(p1).forEach(detach);
      div2_nodes.forEach(detach);
      t8 = claim_space(div4_nodes);
      div3 = claim_element(div4_nodes, "DIV", { class: true });
      var div3_nodes = children(div3);
      a = claim_element(div3_nodes, "A", { href: true, class: true });
      var a_nodes = children(a);
      t9 = claim_text(a_nodes, "Learn more");
      a_nodes.forEach(detach);
      div3_nodes.forEach(detach);
      div4_nodes.forEach(detach);
      div5_nodes.forEach(detach);
      t10 = claim_space(div6_nodes);
      button = claim_element(div6_nodes, "BUTTON", { class: true, target: true, rel: true });
      var button_nodes = children(button);
      span2 = claim_element(button_nodes, "SPAN", { class: true });
      var span2_nodes = children(span2);
      if_block.l(span2_nodes);
      span2_nodes.forEach(detach);
      button_nodes.forEach(detach);
      div6_nodes.forEach(detach);
      div7_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div0, "class", "h-4 w-11/12 rounded-t-3xl bg-cyan-100 md:h-6");
      attr(span0, "class", "hidden md:block");
      attr(span1, "class", "block md:hidden");
      attr(p0, "class", "m-0 mb-1 text-sm font-semibold uppercase tracking-tighter text-cyan-500");
      attr(h2, "class", "m-0 mb-1 text-2xl font-extrabold leading-none text-gray-800 md:my-2 xl:text-3xl xl:leading-none");
      attr(h2, "id", "modal-headline");
      attr(div1, "class", "px-3 sm:px-5 md:px-10");
      attr(p1, "class", "max-w-prose-78 my-2 ml-2 px-3 text-base leading-tight sm:px-5 md:px-10 lg:text-lg lg:leading-snug");
      attr(div2, "class", "flex justify-between");
      attr(a, "href", "https://www.fairpass.co/?utm_src=barrier-learn-more");
      attr(a, "class", "inline-block text-cyan-500 underline");
      attr(div3, "class", "block px-3 sm:px-5 md:hidden");
      attr(div5, "class", "box-border w-full pt-6 sm:pt-6 md:pt-8");
      attr(span2, "class", "flex items-center justify-center gap-2");
      attr(button, "class", "inline-block w-full cursor-pointer rounded-3xl rounded-tl-none rounded-tr-none border-none bg-cyan-500 py-2 text-center text-sm leading-tight text-white no-underline hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-50 sm:text-base md:py-3");
      button.disabled = ctx[2];
      attr(button, "target", "_blank");
      attr(button, "rel", "noreferrer");
      attr(div6, "class", "shadow-xl-all focus-within:shadow-xl-all-darker w-full rounded-3xl rounded-tl-none bg-white font-sans text-gray-800");
      attr(div7, "class", "box-border w-screen max-w-2xl p-4 xl:p-0");
    },
    m(target, anchor) {
      insert_hydration(target, div7, anchor);
      append_hydration(div7, div0);
      append_hydration(div7, t0);
      append_hydration(div7, div6);
      append_hydration(div6, div5);
      append_hydration(div5, div1);
      mount_component(fairpassicon, div1, null);
      append_hydration(div1, t1);
      append_hydration(div1, p0);
      append_hydration(p0, span0);
      append_hydration(span0, t2);
      append_hydration(p0, t3);
      append_hydration(p0, span1);
      append_hydration(span1, t4);
      append_hydration(div1, t5);
      append_hydration(div1, h2);
      append_hydration(h2, t6);
      append_hydration(div5, t7);
      append_hydration(div5, div4);
      append_hydration(div4, div2);
      append_hydration(div2, p1);
      append_hydration(div4, t8);
      append_hydration(div4, div3);
      append_hydration(div3, a);
      append_hydration(a, t9);
      append_hydration(div6, t10);
      append_hydration(div6, button);
      append_hydration(button, span2);
      if_block.m(span2, null);
      current = true;
      if (!mounted) {
        dispose = listen(button, "click", ctx[5]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (current_block_type !== (current_block_type = select_block_type_2(ctx2))) {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(span2, null);
        }
      }
      if (!current || dirty & 4) {
        button.disabled = ctx2[2];
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(fairpassicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(fairpassicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div7);
      destroy_component(fairpassicon);
      if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_1$1(ctx) {
  let div7;
  let div0;
  let t0;
  let div6;
  let div5;
  let div1;
  let fairpassicon;
  let t1;
  let p0;
  let span0;
  let t2;
  let t3;
  let span1;
  let t4;
  let t5;
  let h2;
  let t6;
  let t7;
  let div4;
  let div3;
  let p1;
  let t8;
  let t9;
  let div2;
  let a;
  let span2;
  let t10;
  let t11;
  let button;
  let span3;
  let button_disabled_value;
  let current;
  let mounted;
  let dispose;
  fairpassicon = new FairPassIcon({
    props: {
      class: "h-12 w-12 rounded-full bg-[#88837A] p-1 ring-2 ring-white",
      name: "fairpass/troll"
    }
  });
  function select_block_type_1(ctx2, dirty) {
    if (ctx2[2])
      return create_if_block_2;
    return create_else_block;
  }
  let current_block_type = select_block_type_1(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div7 = element("div");
      div0 = element("div");
      t0 = space();
      div6 = element("div");
      div5 = element("div");
      div1 = element("div");
      create_component(fairpassicon.$$.fragment);
      t1 = space();
      p0 = element("p");
      span0 = element("span");
      t2 = text$1("Verify Your Email to Continue");
      t3 = space();
      span1 = element("span");
      t4 = text$1("Verify Email");
      t5 = space();
      h2 = element("h2");
      t6 = text$1("Check your Email");
      t7 = space();
      div4 = element("div");
      div3 = element("div");
      p1 = element("p");
      t8 = text$1("You're logging in once for all Fair Pass sites. We sent you an\n              email with a link to verify your email address. Click the link to\n              continue.");
      t9 = space();
      div2 = element("div");
      a = element("a");
      span2 = element("span");
      t10 = text$1("Help");
      t11 = space();
      button = element("button");
      span3 = element("span");
      if_block.c();
      this.h();
    },
    l(nodes) {
      div7 = claim_element(nodes, "DIV", { class: true });
      var div7_nodes = children(div7);
      div0 = claim_element(div7_nodes, "DIV", { class: true });
      children(div0).forEach(detach);
      t0 = claim_space(div7_nodes);
      div6 = claim_element(div7_nodes, "DIV", { class: true });
      var div6_nodes = children(div6);
      div5 = claim_element(div6_nodes, "DIV", { class: true });
      var div5_nodes = children(div5);
      div1 = claim_element(div5_nodes, "DIV", { class: true });
      var div1_nodes = children(div1);
      claim_component(fairpassicon.$$.fragment, div1_nodes);
      t1 = claim_space(div1_nodes);
      p0 = claim_element(div1_nodes, "P", { class: true });
      var p0_nodes = children(p0);
      span0 = claim_element(p0_nodes, "SPAN", { class: true });
      var span0_nodes = children(span0);
      t2 = claim_text(span0_nodes, "Verify Your Email to Continue");
      span0_nodes.forEach(detach);
      t3 = claim_space(p0_nodes);
      span1 = claim_element(p0_nodes, "SPAN", { class: true });
      var span1_nodes = children(span1);
      t4 = claim_text(span1_nodes, "Verify Email");
      span1_nodes.forEach(detach);
      p0_nodes.forEach(detach);
      t5 = claim_space(div1_nodes);
      h2 = claim_element(div1_nodes, "H2", { class: true, id: true });
      var h2_nodes = children(h2);
      t6 = claim_text(h2_nodes, "Check your Email");
      h2_nodes.forEach(detach);
      div1_nodes.forEach(detach);
      t7 = claim_space(div5_nodes);
      div4 = claim_element(div5_nodes, "DIV", {});
      var div4_nodes = children(div4);
      div3 = claim_element(div4_nodes, "DIV", { class: true });
      var div3_nodes = children(div3);
      p1 = claim_element(div3_nodes, "P", { class: true });
      var p1_nodes = children(p1);
      t8 = claim_text(p1_nodes, "You're logging in once for all Fair Pass sites. We sent you an\n              email with a link to verify your email address. Click the link to\n              continue.");
      p1_nodes.forEach(detach);
      t9 = claim_space(div3_nodes);
      div2 = claim_element(div3_nodes, "DIV", { class: true });
      var div2_nodes = children(div2);
      a = claim_element(div2_nodes, "A", { href: true, class: true });
      var a_nodes = children(a);
      span2 = claim_element(a_nodes, "SPAN", { class: true });
      var span2_nodes = children(span2);
      t10 = claim_text(span2_nodes, "Help");
      span2_nodes.forEach(detach);
      a_nodes.forEach(detach);
      div2_nodes.forEach(detach);
      div3_nodes.forEach(detach);
      div4_nodes.forEach(detach);
      div5_nodes.forEach(detach);
      div6_nodes.forEach(detach);
      t11 = claim_space(div7_nodes);
      button = claim_element(div7_nodes, "BUTTON", { class: true, target: true, rel: true });
      var button_nodes = children(button);
      span3 = claim_element(button_nodes, "SPAN", { class: true });
      var span3_nodes = children(span3);
      if_block.l(span3_nodes);
      span3_nodes.forEach(detach);
      button_nodes.forEach(detach);
      div7_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div0, "class", "h-4 w-11/12 rounded-t-3xl bg-cyan-100 md:h-6");
      attr(span0, "class", "hidden md:block");
      attr(span1, "class", "block md:hidden");
      attr(p0, "class", "m-0 mb-1 text-sm font-semibold uppercase tracking-tighter text-cyan-500");
      attr(h2, "class", "m-0 mb-1 text-2xl font-extrabold leading-none text-gray-800 md:my-2 xl:text-3xl xl:leading-none");
      attr(h2, "id", "modal-headline");
      attr(div1, "class", "px-3 sm:px-5 md:px-10");
      attr(p1, "class", "max-w-prose-78 my-2 ml-2 px-3 py-4 text-base leading-tight sm:px-5 md:px-10 lg:text-lg lg:leading-snug");
      attr(span2, "class", "h-6 text-white");
      attr(a, "href", "https://www.fairpass.co/?utm_src=barrier-help");
      attr(a, "class", "flex flex-col items-center rounded-l-3xl bg-cyan-800 py-3 px-5 text-white xl:p-6");
      attr(div2, "class", "hidden flex-shrink-0 -translate-y-1/2 self-center text-center md:block");
      attr(div3, "class", "flex justify-between");
      attr(div5, "class", "box-border w-full pt-6 sm:pt-6 md:pt-8");
      attr(div6, "class", "shadow-xl-all focus-within:shadow-xl-all-darker w-full rounded-3xl rounded-tl-none rounded-br-none rounded-bl-none bg-white font-sans text-gray-800");
      attr(span3, "class", "flex items-center justify-center gap-2");
      attr(button, "class", "inline-block w-full cursor-pointer rounded-3xl rounded-tl-none rounded-tr-none border-none bg-cyan-500 py-2 text-center text-sm leading-tight text-white no-underline hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-50 sm:text-base md:py-3");
      button.disabled = button_disabled_value = ctx[2] || ctx[4];
      attr(button, "target", "_blank");
      attr(button, "rel", "noreferrer");
      attr(div7, "class", "box-border w-screen max-w-2xl p-4 xl:p-0");
    },
    m(target, anchor) {
      insert_hydration(target, div7, anchor);
      append_hydration(div7, div0);
      append_hydration(div7, t0);
      append_hydration(div7, div6);
      append_hydration(div6, div5);
      append_hydration(div5, div1);
      mount_component(fairpassicon, div1, null);
      append_hydration(div1, t1);
      append_hydration(div1, p0);
      append_hydration(p0, span0);
      append_hydration(span0, t2);
      append_hydration(p0, t3);
      append_hydration(p0, span1);
      append_hydration(span1, t4);
      append_hydration(div1, t5);
      append_hydration(div1, h2);
      append_hydration(h2, t6);
      append_hydration(div5, t7);
      append_hydration(div5, div4);
      append_hydration(div4, div3);
      append_hydration(div3, p1);
      append_hydration(p1, t8);
      append_hydration(div3, t9);
      append_hydration(div3, div2);
      append_hydration(div2, a);
      append_hydration(a, span2);
      append_hydration(span2, t10);
      append_hydration(div7, t11);
      append_hydration(div7, button);
      append_hydration(button, span3);
      if_block.m(span3, null);
      current = true;
      if (!mounted) {
        dispose = listen(button, "click", ctx[5]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (current_block_type !== (current_block_type = select_block_type_1(ctx2))) {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(span3, null);
        }
      }
      if (!current || dirty & 20 && button_disabled_value !== (button_disabled_value = ctx2[2] || ctx2[4])) {
        button.disabled = button_disabled_value;
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(fairpassicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(fairpassicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div7);
      destroy_component(fairpassicon);
      if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function create_else_block_2(ctx) {
  let t;
  return {
    c() {
      t = text$1("Join \u2192");
    },
    l(nodes) {
      t = claim_text(nodes, "Join \u2192");
    },
    m(target, anchor) {
      insert_hydration(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_if_block_6(ctx) {
  let span;
  let svg;
  let circle;
  let path;
  let t;
  return {
    c() {
      span = element("span");
      svg = svg_element("svg");
      circle = svg_element("circle");
      path = svg_element("path");
      t = text$1("\n            Processing...");
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      svg = claim_svg_element(span_nodes, "svg", { viewBox: true });
      var svg_nodes = children(svg);
      circle = claim_svg_element(svg_nodes, "circle", {
        style: true,
        cx: true,
        cy: true,
        r: true,
        stroke: true,
        "stroke-width": true
      });
      children(circle).forEach(detach);
      path = claim_svg_element(svg_nodes, "path", { style: true, fill: true, d: true });
      children(path).forEach(detach);
      svg_nodes.forEach(detach);
      span_nodes.forEach(detach);
      t = claim_text(nodes, "\n            Processing...");
      this.h();
    },
    h() {
      set_style(circle, "opacity", "0.25");
      attr(circle, "cx", "12");
      attr(circle, "cy", "12");
      attr(circle, "r", "10");
      attr(circle, "stroke", "currentColor");
      attr(circle, "stroke-width", "4");
      set_style(path, "opacity", "0.75");
      attr(path, "fill", "currentColor");
      attr(path, "d", "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z");
      attr(svg, "viewBox", "0 0 24 24");
      attr(span, "class", "h-6 w-6 animate-spin");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, svg);
      append_hydration(svg, circle);
      append_hydration(svg, path);
      insert_hydration(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (detaching)
        detach(t);
    }
  };
}
function create_else_block_1(ctx) {
  let t;
  return {
    c() {
      t = text$1("Resend Email \u2192");
    },
    l(nodes) {
      t = claim_text(nodes, "Resend Email \u2192");
    },
    m(target, anchor) {
      insert_hydration(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_if_block_4(ctx) {
  let span;
  let svg;
  let circle;
  let path;
  let t;
  return {
    c() {
      span = element("span");
      svg = svg_element("svg");
      circle = svg_element("circle");
      path = svg_element("path");
      t = text$1("\n            Processing...");
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      svg = claim_svg_element(span_nodes, "svg", { viewBox: true });
      var svg_nodes = children(svg);
      circle = claim_svg_element(svg_nodes, "circle", {
        style: true,
        cx: true,
        cy: true,
        r: true,
        stroke: true,
        "stroke-width": true
      });
      children(circle).forEach(detach);
      path = claim_svg_element(svg_nodes, "path", { style: true, fill: true, d: true });
      children(path).forEach(detach);
      svg_nodes.forEach(detach);
      span_nodes.forEach(detach);
      t = claim_text(nodes, "\n            Processing...");
      this.h();
    },
    h() {
      set_style(circle, "opacity", "0.25");
      attr(circle, "cx", "12");
      attr(circle, "cy", "12");
      attr(circle, "r", "10");
      attr(circle, "stroke", "currentColor");
      attr(circle, "stroke-width", "4");
      set_style(path, "opacity", "0.75");
      attr(path, "fill", "currentColor");
      attr(path, "d", "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z");
      attr(svg, "viewBox", "0 0 24 24");
      attr(span, "class", "h-6 w-6 animate-spin");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, svg);
      append_hydration(svg, circle);
      append_hydration(svg, path);
      insert_hydration(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (detaching)
        detach(t);
    }
  };
}
function create_else_block(ctx) {
  let t;
  return {
    c() {
      t = text$1("Resend Email \u2192");
    },
    l(nodes) {
      t = claim_text(nodes, "Resend Email \u2192");
    },
    m(target, anchor) {
      insert_hydration(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_if_block_2(ctx) {
  let span;
  let svg;
  let circle;
  let path;
  let t;
  return {
    c() {
      span = element("span");
      svg = svg_element("svg");
      circle = svg_element("circle");
      path = svg_element("path");
      t = text$1("\n          Processing...");
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      svg = claim_svg_element(span_nodes, "svg", { viewBox: true });
      var svg_nodes = children(svg);
      circle = claim_svg_element(svg_nodes, "circle", {
        style: true,
        cx: true,
        cy: true,
        r: true,
        stroke: true,
        "stroke-width": true
      });
      children(circle).forEach(detach);
      path = claim_svg_element(svg_nodes, "path", { style: true, fill: true, d: true });
      children(path).forEach(detach);
      svg_nodes.forEach(detach);
      span_nodes.forEach(detach);
      t = claim_text(nodes, "\n          Processing...");
      this.h();
    },
    h() {
      set_style(circle, "opacity", "0.25");
      attr(circle, "cx", "12");
      attr(circle, "cy", "12");
      attr(circle, "r", "10");
      attr(circle, "stroke", "currentColor");
      attr(circle, "stroke-width", "4");
      set_style(path, "opacity", "0.75");
      attr(path, "fill", "currentColor");
      attr(path, "d", "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z");
      attr(svg, "viewBox", "0 0 24 24");
      attr(span, "class", "h-6 w-6 animate-spin");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, svg);
      append_hydration(svg, circle);
      append_hydration(svg, path);
      insert_hydration(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (detaching)
        detach(t);
    }
  };
}
function create_if_block$1(ctx) {
  let div5;
  let div4;
  let div3;
  let div0;
  let svg;
  let path;
  let t0;
  let div2;
  let div1;
  let p;
  let t1;
  let div5_intro;
  let div5_outro;
  let current;
  return {
    c() {
      div5 = element("div");
      div4 = element("div");
      div3 = element("div");
      div0 = element("div");
      svg = svg_element("svg");
      path = svg_element("path");
      t0 = space();
      div2 = element("div");
      div1 = element("div");
      p = element("p");
      t1 = text$1(ctx[3]);
      this.h();
    },
    l(nodes) {
      div5 = claim_element(nodes, "DIV", { class: true });
      var div5_nodes = children(div5);
      div4 = claim_element(div5_nodes, "DIV", { class: true });
      var div4_nodes = children(div4);
      div3 = claim_element(div4_nodes, "DIV", { class: true });
      var div3_nodes = children(div3);
      div0 = claim_element(div3_nodes, "DIV", { class: true });
      var div0_nodes = children(div0);
      svg = claim_svg_element(div0_nodes, "svg", {
        class: true,
        xmlns: true,
        viewBox: true,
        fill: true,
        "aria-hidden": true
      });
      var svg_nodes = children(svg);
      path = claim_svg_element(svg_nodes, "path", {
        "fill-rule": true,
        d: true,
        "clip-rule": true
      });
      children(path).forEach(detach);
      svg_nodes.forEach(detach);
      div0_nodes.forEach(detach);
      t0 = claim_space(div3_nodes);
      div2 = claim_element(div3_nodes, "DIV", { class: true });
      var div2_nodes = children(div2);
      div1 = claim_element(div2_nodes, "DIV", { class: true });
      var div1_nodes = children(div1);
      p = claim_element(div1_nodes, "P", {});
      var p_nodes = children(p);
      t1 = claim_text(p_nodes, ctx[3]);
      p_nodes.forEach(detach);
      div1_nodes.forEach(detach);
      div2_nodes.forEach(detach);
      div3_nodes.forEach(detach);
      div4_nodes.forEach(detach);
      div5_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(path, "fill-rule", "evenodd");
      attr(path, "d", "M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z");
      attr(path, "clip-rule", "evenodd");
      attr(svg, "class", "h-5 w-5 text-yellow-400");
      attr(svg, "xmlns", "http://www.w3.org/2000/svg");
      attr(svg, "viewBox", "0 0 20 20");
      attr(svg, "fill", "currentColor");
      attr(svg, "aria-hidden", "true");
      attr(div0, "class", "flex-shrink-0");
      attr(div1, "class", "mt-2 text-sm text-yellow-700");
      attr(div2, "class", "ml-3");
      attr(div3, "class", "flex");
      attr(div4, "class", "w-full max-w-md rounded-sm bg-yellow-50 p-4");
      attr(div5, "class", "absolute top-2 z-[100] m-auto w-full");
    },
    m(target, anchor) {
      insert_hydration(target, div5, anchor);
      append_hydration(div5, div4);
      append_hydration(div4, div3);
      append_hydration(div3, div0);
      append_hydration(div0, svg);
      append_hydration(svg, path);
      append_hydration(div3, t0);
      append_hydration(div3, div2);
      append_hydration(div2, div1);
      append_hydration(div1, p);
      append_hydration(p, t1);
      current = true;
    },
    p(ctx2, dirty) {
      if (!current || dirty & 8)
        set_data(t1, ctx2[3]);
    },
    i(local) {
      if (current)
        return;
      add_render_callback(() => {
        if (div5_outro)
          div5_outro.end(1);
        div5_intro = create_in_transition(div5, fade, {});
        div5_intro.start();
      });
      current = true;
    },
    o(local) {
      if (div5_intro)
        div5_intro.invalidate();
      div5_outro = create_out_transition(div5, fade, {});
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div5);
      if (detaching && div5_outro)
        div5_outro.end();
    }
  };
}
function create_fragment$1(ctx) {
  let current_block_type_index;
  let if_block0;
  let t;
  let if_block1_anchor;
  let current;
  const if_block_creators = [create_if_block_1$1, create_if_block_3, create_if_block_5, create_else_block_3];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[0] === "verify-email")
      return 0;
    if (ctx2[0] === "new-user")
      return 1;
    if (ctx2[0] === "stop")
      return 2;
    return 3;
  }
  current_block_type_index = select_block_type(ctx);
  if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  let if_block1 = ctx[3] && create_if_block$1(ctx);
  return {
    c() {
      if_block0.c();
      t = space();
      if (if_block1)
        if_block1.c();
      if_block1_anchor = empty();
    },
    l(nodes) {
      if_block0.l(nodes);
      t = claim_space(nodes);
      if (if_block1)
        if_block1.l(nodes);
      if_block1_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert_hydration(target, t, anchor);
      if (if_block1)
        if_block1.m(target, anchor);
      insert_hydration(target, if_block1_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block0 = if_blocks[current_block_type_index];
        if (!if_block0) {
          if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block0.c();
        } else {
          if_block0.p(ctx2, dirty);
        }
        transition_in(if_block0, 1);
        if_block0.m(t.parentNode, t);
      }
      if (ctx2[3]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
          if (dirty & 8) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block$1(ctx2);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block0);
      transition_in(if_block1);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(if_block1);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching)
        detach(t);
      if (if_block1)
        if_block1.d(detaching);
      if (detaching)
        detach(if_block1_anchor);
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  let { href: href2 = "#" } = $$props;
  let { fpScope = "global" } = $$props;
  let { step = "stop" } = $$props;
  let { open = false } = $$props;
  let email = "";
  let working = false;
  let submissionError;
  let buttonDisabled = false;
  onMount(() => {
  });
  const handleSignup = async () => {
    if (buttonDisabled) {
      return;
    }
    $$invalidate(2, working = true);
    if (!email || !email.includes("@") && email.length > 4) {
      $$invalidate(3, submissionError = "Please enter a valid email address");
      setTimeout(
        () => {
          $$invalidate(3, submissionError = null);
        },
        6e3
      );
      $$invalidate(2, working = false);
      return;
    }
    const FAIRPASS_ENDPOINT = window.location.hostname === "dev.loremlabs.com" ? "https://dev.loremlabs.com:5173/api/v1" : "https://www.fairpass.co/api/v1";
    const flow = "simple-email-001";
    const input = {
      email,
      src: window.location.href,
      pow: {},
      flow
    };
    const qp = new URLSearchParams(window.location.search);
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign"];
    utmKeys.forEach((key) => {
      const value = qp.get(key);
      if (value) {
        input[key] = value;
      }
    });
    const worker = shaWorker();
    const nonce = Math.random().toString(36).substr(2, 10);
    worker.postMessage({ type: "sha256", nonce, scope: fpScope });
    worker.addEventListener(
      "message",
      async (msg) => {
        var _a;
        if (((_a = msg.data) == null ? void 0 : _a.type) === "sha256") {
          input.pow = msg.data;
          delete input.pow.scope;
          delete input.pow.type;
          delete input.pow.hash;
          input.pow.t = parseInt(input.pow.duration, 10);
          delete input.pow.duration;
          $$invalidate(4, buttonDisabled = true);
          setTimeout(
            () => {
              $$invalidate(4, buttonDisabled = false);
            },
            15e3
          );
          try {
            const result = await fetch(`${FAIRPASS_ENDPOINT}/signup/${fpScope}`, {
              method: "POST",
              referrerPolicy: "origin-when-cross-origin",
              headers: {
                "content-type": "application/json",
                "api-key": apiKey
              },
              body: JSON.stringify(input),
              credentials: "include"
            });
            const data = await result.json();
            if (!result.ok) {
              throw new Error((data == null ? void 0 : data.message) || "An error occurred. Try again.");
            }
            const actions = data.actions || [];
            console.group("actions");
            console.log(actions);
            console.groupEnd();
            if (actions.includes("current-user")) {
              $$invalidate(6, open = false);
              $$invalidate(2, working = false);
              return;
            }
            if (actions.includes("verify-email-soft")) {
              $$invalidate(0, step = "verify-email");
            }
            if (actions.includes("verify-email-required")) {
              $$invalidate(0, step = "verify-email");
            }
            if (actions.includes("new-user")) {
              $$invalidate(0, step = "new-user");
            }
            let activeCheck = true;
            let pollAttempts = 0;
            const poll = async () => {
              pollAttempts++;
              if (!(data == null ? void 0 : data.linkId) || !activeCheck || pollAttempts > 20) {
                return;
              }
              try {
                const checkResult = await fetch(`${FAIRPASS_ENDPOINT}/magic/check`, {
                  method: "POST",
                  referrerPolicy: "origin-when-cross-origin",
                  headers: {
                    "content-type": "application/json",
                    "api-key": apiKey
                  },
                  body: JSON.stringify({ linkId: data.linkId }),
                  credentials: "include"
                });
                const pollData = await checkResult.json();
                if (!checkResult.ok) {
                  throw new Error((pollData == null ? void 0 : pollData.error) || "An error occurred. Try again.");
                }
                if (pollData == null ? void 0 : pollData.verified) {
                  $$invalidate(6, open = false);
                  $$invalidate(2, working = false);
                  window.location.reload();
                  return;
                }
              } catch (error) {
                console.error(error);
              }
              setTimeout(
                () => {
                  poll();
                },
                500
              );
            };
            poll();
          } catch (error) {
            console.error("err", error);
            $$invalidate(3, submissionError = error.message);
            setTimeout(
              () => {
                $$invalidate(3, submissionError = null);
              },
              5e3
            );
          }
          worker.terminate();
          $$invalidate(2, working = false);
        } else {
          console.error("unknown message type", msg.data.type);
        }
      },
      false
    );
    return false;
  };
  function input_input_handler() {
    email = this.value;
    $$invalidate(1, email);
  }
  const keydown_handler = (ev) => {
    if (ev.key === "Enter") {
      handleSignup();
    }
  };
  $$self.$$set = ($$props2) => {
    if ("href" in $$props2)
      $$invalidate(7, href2 = $$props2.href);
    if ("fpScope" in $$props2)
      $$invalidate(8, fpScope = $$props2.fpScope);
    if ("step" in $$props2)
      $$invalidate(0, step = $$props2.step);
    if ("open" in $$props2)
      $$invalidate(6, open = $$props2.open);
  };
  return [
    step,
    email,
    working,
    submissionError,
    buttonDisabled,
    handleSignup,
    open,
    href2,
    fpScope,
    input_input_handler,
    keydown_handler
  ];
}
class FairPassSimpleEmail001 extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, { href: 7, fpScope: 8, step: 0, open: 6 });
  }
}
var global = "";
function create_if_block(ctx) {
  let div3;
  let div2;
  let div0;
  let t0;
  let span;
  let t1;
  let t2;
  let t3;
  let div1;
  let fairpasssimpleemail001;
  let updating_open;
  let div3_intro;
  let div3_outro;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[1] === "true" && create_if_block_1(ctx);
  function fairpasssimpleemail001_open_binding(value) {
    ctx[8](value);
  }
  let fairpasssimpleemail001_props = {};
  if (ctx[0] !== void 0) {
    fairpasssimpleemail001_props.open = ctx[0];
  }
  fairpasssimpleemail001 = new FairPassSimpleEmail001({ props: fairpasssimpleemail001_props });
  binding_callbacks.push(() => bind(fairpasssimpleemail001, "open", fairpasssimpleemail001_open_binding));
  return {
    c() {
      div3 = element("div");
      div2 = element("div");
      div0 = element("div");
      t0 = space();
      span = element("span");
      t1 = text$1("\u200B");
      t2 = space();
      if (if_block)
        if_block.c();
      t3 = space();
      div1 = element("div");
      create_component(fairpasssimpleemail001.$$.fragment);
      this.h();
    },
    l(nodes) {
      div3 = claim_element(nodes, "DIV", {
        class: true,
        role: true,
        "aria-modal": true,
        "aria-labelledby": true
      });
      var div3_nodes = children(div3);
      div2 = claim_element(div3_nodes, "DIV", { class: true });
      var div2_nodes = children(div2);
      div0 = claim_element(div2_nodes, "DIV", {
        role: true,
        "aria-hidden": true,
        class: true
      });
      children(div0).forEach(detach);
      t0 = claim_space(div2_nodes);
      span = claim_element(div2_nodes, "SPAN", { class: true, "aria-hidden": true });
      var span_nodes = children(span);
      t1 = claim_text(span_nodes, "\u200B");
      span_nodes.forEach(detach);
      t2 = claim_space(div2_nodes);
      if (if_block)
        if_block.l(div2_nodes);
      t3 = claim_space(div2_nodes);
      div1 = claim_element(div2_nodes, "DIV", { class: true });
      var div1_nodes = children(div1);
      claim_component(fairpasssimpleemail001.$$.fragment, div1_nodes);
      div1_nodes.forEach(detach);
      div2_nodes.forEach(detach);
      div3_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div0, "role", "button");
      attr(div0, "aria-hidden", "");
      attr(div0, "class", "backdrop fixed inset-0 z-30 cursor-pointer bg-gray-500/75 outline-none");
      attr(span, "class", "hidden sm:inline-block sm:h-screen sm:align-middle");
      attr(span, "aria-hidden", "true");
      attr(div1, "class", "z-50 cursor-default");
      attr(div2, "class", "flex min-h-screen cursor-pointer items-center justify-center");
      attr(div3, "class", "fixed inset-0 z-10 overflow-y-auto");
      attr(div3, "role", "dialog");
      attr(div3, "aria-modal", true);
      attr(div3, "aria-labelledby", "modal-headline");
    },
    m(target, anchor) {
      insert_hydration(target, div3, anchor);
      append_hydration(div3, div2);
      append_hydration(div2, div0);
      append_hydration(div2, t0);
      append_hydration(div2, span);
      append_hydration(span, t1);
      append_hydration(div2, t2);
      if (if_block)
        if_block.m(div2, null);
      append_hydration(div2, t3);
      append_hydration(div2, div1);
      mount_component(fairpasssimpleemail001, div1, null);
      current = true;
      if (!mounted) {
        dispose = listen(div0, "click", ctx[6]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (ctx2[1] === "true") {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_1(ctx2);
          if_block.c();
          if_block.m(div2, t3);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      const fairpasssimpleemail001_changes = {};
      if (!updating_open && dirty & 1) {
        updating_open = true;
        fairpasssimpleemail001_changes.open = ctx2[0];
        add_flush_callback(() => updating_open = false);
      }
      fairpasssimpleemail001.$set(fairpasssimpleemail001_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(fairpasssimpleemail001.$$.fragment, local);
      add_render_callback(() => {
        if (div3_outro)
          div3_outro.end(1);
        div3_intro = create_in_transition(div3, fade, {});
        div3_intro.start();
      });
      current = true;
    },
    o(local) {
      transition_out(fairpasssimpleemail001.$$.fragment, local);
      if (div3_intro)
        div3_intro.invalidate();
      div3_outro = create_out_transition(div3, fade, {});
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div3);
      if (if_block)
        if_block.d();
      destroy_component(fairpasssimpleemail001);
      if (detaching && div3_outro)
        div3_outro.end();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_1(ctx) {
  let div;
  let button;
  let svg;
  let path;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      button = element("button");
      svg = svg_element("svg");
      path = svg_element("path");
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { class: true });
      var div_nodes = children(div);
      button = claim_element(div_nodes, "BUTTON", {
        type: true,
        class: true,
        "aria-label": true,
        title: true
      });
      var button_nodes = children(button);
      svg = claim_svg_element(button_nodes, "svg", { class: true, viewBox: true });
      var svg_nodes = children(svg);
      path = claim_svg_element(svg_nodes, "path", {
        stroke: true,
        fill: true,
        "stroke-linecap": true,
        "stroke-linejoin": true,
        "stroke-width": true,
        d: true
      });
      children(path).forEach(detach);
      svg_nodes.forEach(detach);
      button_nodes.forEach(detach);
      div_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(path, "stroke", "currentColor");
      attr(path, "fill", "none");
      attr(path, "stroke-linecap", "round");
      attr(path, "stroke-linejoin", "round");
      attr(path, "stroke-width", "2");
      attr(path, "d", "M6 18L18 6M6 6l12 12");
      attr(svg, "class", "z-60 h-8 w-8 rounded-full bg-gray-800 text-white hover:text-gray-500");
      attr(svg, "viewBox", "0 0 24 24");
      attr(button, "type", "button");
      attr(button, "class", "cursor-pointer border-0 bg-transparent outline-none");
      attr(button, "aria-label", "Close");
      attr(button, "title", "Close");
      attr(div, "class", "absolute right-4 top-4 z-50 bg-transparent");
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      append_hydration(div, button);
      append_hydration(button, svg);
      append_hydration(svg, path);
      if (!mounted) {
        dispose = listen(button, "click", ctx[7]);
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching)
        detach(div);
      mounted = false;
      dispose();
    }
  };
}
function create_fragment(ctx) {
  let if_block_anchor;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[3] && ctx[0] && create_if_block(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    l(nodes) {
      if (if_block)
        if_block.l(nodes);
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert_hydration(target, if_block_anchor, anchor);
      current = true;
      if (!mounted) {
        dispose = listen(window, "keydown", ctx[4]);
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (ctx2[3] && ctx2[0]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 9) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
      mounted = false;
      dispose();
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let { closeable = "true" } = $$props;
  let { open = true } = $$props;
  const dispatch2 = createEventDispatcher();
  function hide() {
    if (!open)
      return;
    if (closeable === "true") {
      $$invalidate(0, open = false);
      dispatch2("hide");
    }
  }
  let { handleCancel = () => {
    hide();
    this.dispatchEvent(new CustomEvent(
      "fairpass:modal:close",
      {
        composed: true,
        detail: { type: "cancel" }
      }
    ));
  } } = $$props;
  let loaded = false;
  onMount(() => {
    $$invalidate(3, loaded = true);
  });
  function handleKeydown(event) {
    if (event.key === "Escape") {
      hide();
    }
  }
  const click_handler = () => {
    handleCancel();
  };
  const click_handler_1 = () => {
    handleCancel();
  };
  function fairpasssimpleemail001_open_binding(value) {
    open = value;
    $$invalidate(0, open);
  }
  $$self.$$set = ($$props2) => {
    if ("closeable" in $$props2)
      $$invalidate(1, closeable = $$props2.closeable);
    if ("open" in $$props2)
      $$invalidate(0, open = $$props2.open);
    if ("handleCancel" in $$props2)
      $$invalidate(2, handleCancel = $$props2.handleCancel);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 9) {
      {
        if (loaded && open) {
          this.document.body.style.overflow = "hidden";
        } else {
          this.document.body.style.overflow = "auto";
        }
      }
    }
  };
  return [
    open,
    closeable,
    handleCancel,
    loaded,
    handleKeydown,
    hide,
    click_handler,
    click_handler_1,
    fairpasssimpleemail001_open_binding
  ];
}
class FairPassModal extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {
      closeable: 1,
      open: 0,
      hide: 5,
      handleCancel: 2
    });
  }
  get hide() {
    return this.$$.ctx[5];
  }
}
export { FairPassModal as default, defaults };
//# sourceMappingURL=FairPassModal.mjs.map

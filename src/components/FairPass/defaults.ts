import type { Type } from "../../utils/constants";
export type { Type };
export type Theme = "light" | "dark" | "dim";

export const scope = "global";
export const scopePercent = 100;
export const state = "init";
export const acceptable = "fairpass/*, webmon/*";
export const pass = "";
export const apiKey = "djE";
export const hurrah = "true"; // true false watermark
export const threshold = 0.1;
export const mode = "lax"; // "strict" | "lax"

export const getProps = (type: Type) => ({
  scope,
  scopePercent,
  state,
  acceptable,
  pass,
  apiKey,
  hurrah,
  threshold,
  mode,
});

// @ts-check
/**
 * These are the base for final custom elements.
 */

const INPUT_DIR = "src/elements";
const OUTPUT_DIR = "dist/.elements";

const path = require("path");
const { defineConfig, build } = require("vite");
const { svelte } = require("@sveltejs/vite-plugin-svelte");
const { isProdEnv, watch, getInputs } = require("./utils.cjs");

/**
 * @param {string} componentName
 */
function getViteConfig(componentName) {
  const viteConfig = defineConfig({
    root: path.resolve(__dirname, ".."),
    publicDir: false,
    clearScreen: false,
    mode: isProdEnv ? "production" : "development",
    build: {
      emptyOutDir: false,
      watch: watch ? { exclude: `${INPUT_DIR}/*.ts` } : null,
      sourcemap: true,
      ...(!isProdEnv ? { minify: false } : {}),
      lib: {
        formats: ["es"],
        name: componentName.replace("-", ""),
        entry: `${INPUT_DIR}/${componentName}.svelte`,
        fileName: "script",
      },
      outDir: `${OUTPUT_DIR}/${componentName}/`,
    },
    plugins: [svelte()],
  });
  return viteConfig;
}

async function buildComponents(inputs) {
  await Promise.all(
    inputs.map((elem) => getViteConfig(elem)).map((conf) => build(conf))
  );
}

const inputs = getInputs(
  INPUT_DIR,
  /^([A-Z]\w*[A-Z]\w*)\.svelte$/,
  process.env.COMPONENT
);

console.log({ inputs });
buildComponents(inputs);

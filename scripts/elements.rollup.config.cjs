// @ts-check
/**
 * Rollup config for final Custom Elements
 *
 * The result of this is what websites will embed.
 */

const INPUT_DIR = "src/elements";
const OUTPUT_DIR = "dist";

const path = require("path");
const alias = require("@rollup/plugin-alias");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const typescript = require("@rollup/plugin-typescript");
const { terser } = require("rollup-plugin-terser");
const sourcemaps = require("rollup-plugin-sourcemaps");
const sizes = require("rollup-plugin-sizes");
const css = require("rollup-plugin-import-css");
const { isProdEnv, getInputs } = require("./utils.cjs");

/**
 * @param {string} elementName
 * @returns {import('rollup').RollupOptions}
 */
function getRollupConfig(elementName) {
  const rollupConfig = {
    input: `${INPUT_DIR}/${elementName}.ts`,
    output: {
      sourcemap: true,
      name: elementName.replace("-", ""),
      format: "es",
      file: `${OUTPUT_DIR}/${elementName}.js`,
    },
    plugins: [
      nodeResolve(),
      // @ts-expect-error
      typescript(),
      // @ts-expect-error
      sourcemaps(),
      // @ts-expect-error
      alias({
        entries: {
          "@elements": path.join(__dirname, "../dist/.elements"),
        },
      }),
      // @ts-expect-error
      css(),
      isProdEnv && terser(),
      sizes({ details: true }),
    ],
  };
  console.log({
    elementName,
    p: path.join(__dirname, "../dist/.elements"),
    rollupConfig,
  });
  return rollupConfig;
}

const inputs = getInputs(INPUT_DIR, /^(\w+-\w+)\.ts$/, process.env.ELEMENT);

module.exports = inputs.map((elem) => getRollupConfig(elem));

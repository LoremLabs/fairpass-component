const colors = require("tailwindcss/colors");

/** @type {import("@types/tailwindcss/tailwind-config").TailwindConfig} */
module.exports = {
  corePlugins: {
    preflight: false,
  },
  mode: "jit",
  //   content: ['./src/**/*.{js,svelte,ts}'],
  purge: {
    content: ["./src/**/*.{js,svelte,ts}"],
    options: {
      prefix: "svelte-",
      safelist: [/\-webmon\-/], // TODO(mankins): this doesn't seem to work so span hacks...
    },
  },
  theme: {
    extend: {
      colors: {
        ...colors,
      },
      width: {
        95: "95%",
        98: "98%",
      },
      maxWidth: {
        "prose-72": "72ch",
        "prose-78": "78ch",
      },
      boxShadow: {
        "xl-all": "0 0 20px rgba(0, 0, 0, 0.3)",
        "xl-all-darker": "0 0 20px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "wm-blink": "blink 2s infinite",
        openpass: "openpass 2s forwards",
        openfree: "openfree 2s forwards",
        closedpass: "closedpass 2s forwards",
        closednopass: "closednopass 2s forwards",
        watermark: "watermark 2s forwards",
      },
      keyframes: {
        blink: {
          "0%, 30%": { opacity: 1 },
          "10%": { opacity: 0 },
        },
        watermark: {
          "0%": { opacity: 0.05, transform: "scale(1)" },
          "60%": { opacity: 1, transform: "scale(1.25)" },
          "100%": {
            opacity: 0,
          },
        },
        openpass: {
          "0%": { transform: "scale(.1)", opacity: 0.75 },
          "60%": { transform: "scale(3)", opacity: 0.75 },
          "100%": {
            transform: "scale(50)",
            opacity: 0,
          },
        },
        openfree: {
          "0%": { transform: "scale(.1)", opacity: 0.75 },
          "60%": { transform: "scale(3)", opacity: 0.75 },
          "100%": {
            transform: "scale(50)",
            opacity: 0,
          },
        },
        closedpass: {
          "0%": { transform: "scale(.1)", opacity: 0.75 },
          "60%": { transform: "scale(3)", opacity: 0.75 },
          "100%": {
            transform: "scale(50)",
            opacity: 0,
          },
        },
        closednopass: {
          "0%": { transform: "scale(.1)", opacity: 0.75 },
          "60%": { transform: "scale(3)", opacity: 0.75 },
          "100%": {
            transform: "scale(50)",
            opacity: 0,
          },
        },
      },
      zIndex: {
        "-1": -1,
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/line-clamp")],
};

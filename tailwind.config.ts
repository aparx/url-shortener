import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeFromBelow: {
          "0%": {
            transform: "translate(-52%, -52%)",
            opacity: "0",
            scale: "0.96"
          },
          "100%": {
            transform: "translate(-50%, -50%)",
            opacity: "1",
            scale: "1",
          },
        },
      },
      animation: {
        fadeFromBelow:
          "fadeFromBelow 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        highlight: {
          DEFAULT: "hsl(var(--color-highlight))",
          light: "hsl(var(--color-highlight-light))",
          dark: "hsl(var(--color-highlight-dark))",
          muted: "hsl(var(--color-highlight-muted))",
        },
      },
    },
  },
} satisfies Config;

export default config;

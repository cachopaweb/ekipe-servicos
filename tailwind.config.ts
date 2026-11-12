import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#312783',
          blue: '#312783',
          hover: '#241c64',
          soft: '#f2f1fb',
          border: '#dad7ef',
          gold: '#facc00',
          goldSoft: '#fef9db',
          goldInk: '#7c5e00',
          'gold-soft': '#fef9db',
          'gold-ink': '#7c5e00',
        },
        ek: {
          ground: '#f5f6fa',
          surface: '#ffffff',
          raised: '#f7f8fb',
          active: '#eceef6',
          border: '#e5e7ef',
          rule: '#eef0f5',
          control: '#cfd4e0',
          text: '#13151d',
          muted: '#5c6070',
          faint: '#6b7080',
        },
      },
      opacity: {
        45: '0.45',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

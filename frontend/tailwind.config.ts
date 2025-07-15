import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#22c55e",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          foreground: "#1a2e1a", // Adding primary-foreground color
        },
        secondary: {
          DEFAULT: "#a3a3a3",
          foreground: "#ffffff", // Adding secondary-foreground color
        },
        background: "#000000",
        foreground: "#ffffff",
        card: {
          DEFAULT: "#0a0a0a",
          foreground: "#ffffff", // Adding card-foreground color
        },
        border: "#262626",
        input: "hsl(var(--input))",
        ring: "#22c55e",
        muted: {
          DEFAULT: "#262626",
          foreground: "#a3a3a3",
        },
        accent: {
          DEFAULT: "#262626",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--brand-border)",
        input: "var(--brand-border)",
        ring: "hsl(var(--ring))",
        background: "var(--brand-background)",
        foreground: "var(--brand-text)",
        primary: {
          DEFAULT: "rgb(var(--brand-blue-rgb) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "rgb(var(--brand-blue-rgb) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "var(--brand-muted)",
        },
        accent: {
          DEFAULT: "var(--brand-soft)",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "calc(1rem - 2px)",
        sm: "calc(1rem - 4px)",
      },
      boxShadow: {
        panel: "0 18px 45px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(15, 23, 42, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.07) 1px, transparent 1px)",
      },
      fontFamily: {
        heading: ["var(--font-body)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;

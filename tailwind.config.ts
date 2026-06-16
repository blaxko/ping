import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#07111F",
        surface: "#0C1B31",
        surfaceAlt: "#132645",
        electric: "#2E6BFF",
        electricSoft: "#6FA1FF",
        border: "rgba(160, 191, 255, 0.14)",
        text: "#F5F8FF",
        muted: "#93A6C7",
        danger: "#FB7185",
        success: "#22C55E",
        warning: "#F59E0B"
      },
      fontFamily: {
        sans: ["var(--font-inter)"]
      },
      boxShadow: {
        glow: "0 18px 80px rgba(46, 107, 255, 0.18)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(160,191,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(160,191,255,0.07) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;

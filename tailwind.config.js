/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          950: "#0E1014",
          900: "#12151B",
          800: "#1A1D23",
          700: "#252934",
          600: "#303644",
          500: "#3D4455",
        },
        gold: {
          50: "#FBF7EE",
          100: "#F4EAD1",
          200: "#E8D5A4",
          300: "#D9BE7C",
          400: "#C5A267",
          500: "#A98548",
          600: "#8A6A37",
          700: "#6B512A",
        },
        status: {
          scheduled: "#6B7A89",
          selected: "#3B82F6",
          awaiting_payment: "#C5A267",
          completed: "#22C55E",
          overdue: "#D64545",
          rescheduling: "#F59E0B",
          cancelled: "#9CA3AF",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Source Han Serif SC", "Songti SC", "ui-serif", "serif"],
        sans: ['"PingFang SC"', "-apple-system", "BlinkMacSystemFont", "ui-sans-serif", "sans-serif"],
        mono: ['"SF Mono"', "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(197,162,103,0.35), 0 8px 30px -8px rgba(197,162,103,0.35)",
      },
    },
  },
  plugins: [],
};

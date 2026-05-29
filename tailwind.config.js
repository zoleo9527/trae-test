/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        forest: {
          50: "#F0FFF4",
          100: "#C6F6D5",
          200: "#95D5B2",
          300: "#74C69D",
          400: "#52B788",
          500: "#40916C",
          600: "#2D6A4F",
          700: "#1B4332",
          800: "#143028",
          900: "#0D1F1A",
        },
        accent: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        danger: {
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
        },
        surface: "#FFFFFF",
        border: "#E7E5E4",
        bg: "#FAFAF9",
        text: {
          primary: "#1C1917",
          secondary: "#57534E",
          muted: "#A8A29E",
        },
        status: {
          green: "#16A34A",
          amber: "#D97706",
          red: "#DC2626",
          gray: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          950: "#0B1A22",
          900: "#0F3A4A",
          800: "#144A5C",
          700: "#1B6073",
        },
        amber: {
          450: "#E8A53C",
        },
        bone: {
          50: "#F7F4ED",
          100: "#EFE9DB",
        },
        danger: {
          500: "#C0392B",
        },
        success: {
          500: "#2F855A",
        },
      },
      fontFamily: {
        display: ["'Noto Serif SC'", "'Source Han Serif SC'", "serif"],
        body: ["'PingFang SC'", "'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 26, 34, 0.08), 0 8px 24px rgba(11, 26, 34, 0.06)",
      },
    },
  },
  plugins: [],
};

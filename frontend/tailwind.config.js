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
        bakery: {
          50: '#FDF8F3',
          100: '#FAF6F1',
          200: '#F5EDE4',
          300: '#E8E0D8',
          400: '#D4C8BC',
          500: '#A0522D',
          600: '#8B4513',
          700: '#6B3410',
          800: '#3E2723',
          900: '#2C1810',
        },
        accent: {
          DEFAULT: '#E85D3A',
          hover: '#D64D2A',
          light: '#FDE8E2',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['"DM Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        lg: '10px',
      },
    },
  },
  plugins: [],
};

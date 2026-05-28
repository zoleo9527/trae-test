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
        bg: {
          primary: '#0f0f1a',
          secondary: '#1a1a2e',
          tertiary: '#252540',
        },
        accent: {
          DEFAULT: '#e8a838',
          hover: '#f0b84d',
          dim: 'rgba(232, 168, 56, 0.1)',
        },
        txt: {
          primary: '#f0f0f5',
          secondary: '#a0a0b8',
          muted: '#6b6b80',
        },
        border: {
          DEFAULT: '#2a2a45',
          hover: '#3a3a55',
        },
      },
    },
  },
  plugins: [],
};

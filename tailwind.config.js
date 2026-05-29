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
        warm: 'var(--bg-warm)',
        card: 'var(--bg-card)',
        sidebar: 'var(--bg-sidebar)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        amber: {
          DEFAULT: 'var(--accent-amber)',
          light: 'var(--accent-amber-light)',
          bg: 'var(--accent-amber-bg)',
        },
        danger: {
          DEFAULT: 'var(--accent-red)',
          bg: 'var(--accent-red-bg)',
        },
        success: {
          DEFAULT: 'var(--accent-green)',
          bg: 'var(--accent-green-bg)',
        },
        info: {
          DEFAULT: 'var(--accent-blue)',
          bg: 'var(--accent-blue-bg)',
        },
        border: 'var(--border)',
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
    },
  },
  plugins: [],
};

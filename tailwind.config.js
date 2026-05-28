/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#fef9f0',
          100: '#fdf0d9',
          200: '#f9deaf',
          300: '#f5c67a',
          400: '#efa644',
          500: '#e8a838',
          600: '#d98921',
          700: '#b5691c',
          800: '#91531e',
          900: '#76451c',
        },
        'dark': {
          50: '#f5f5f7',
          100: '#e6e6eb',
          200: '#c9c9d4',
          300: '#a1a1b5',
          400: '#73738f',
          500: '#4a5568',
          600: '#3d465c',
          700: '#343a4c',
          800: '#2d3142',
          900: '#1a1a2e',
        },
        'success': '#48bb78',
        'danger': '#fc5c65',
        'warning': '#ed8936',
        'info': '#4299e1',
      },
      fontFamily: {
        'sans': ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        'mono': ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'btn': '6px',
      },
    },
  },
  plugins: [],
}

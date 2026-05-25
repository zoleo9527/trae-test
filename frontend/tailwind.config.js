/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        museum: {
          50: '#f8f7f4',
          100: '#e8e4db',
          200: '#d4cbb8',
          300: '#bba88c',
          400: '#a88f6c',
          500: '#8b7355',
          600: '#725c44',
          700: '#5c4a38',
          800: '#4a3b2e',
          900: '#3d3127',
        }
      }
    },
  },
  plugins: [],
}

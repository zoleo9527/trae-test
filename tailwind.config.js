/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tea: {
          50: '#f6f7f4',
          100: '#e6ebe0',
          200: '#cfd9c5',
          300: '#aebf9f',
          400: '#89a074',
          500: '#6b8555',
          600: '#526a42',
          700: '#415436',
          800: '#36442e',
          900: '#2e3a28',
        },
        brand: {
          primary: '#5d4e37',
          secondary: '#8b7355',
          accent: '#c9a86c'
        }
      }
    },
  },
  plugins: [],
}

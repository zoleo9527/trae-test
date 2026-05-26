/** @type {import('tailwindcss').Config} */
export default {
  content: ['./components/**/*.{vue,js,ts}', './layouts/**/*.vue', './pages/**/*.vue', './app.vue'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dbeefe',
          200: '#bfe2fe',
          300: '#93d0fd',
          400: '#60b5fa',
          500: '#3b95f6',
          600: '#2578eb',
          700: '#1d63d7',
          800: '#1e52ae',
          900: '#1d468a',
        },
      },
    },
  },
  plugins: [],
}

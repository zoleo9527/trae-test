/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        museum: {
          50: '#f6f5f3',
          100: '#e8e5df',
          200: '#d1cbbf',
          300: '#b5aa97',
          400: '#9a8a73',
          500: '#86755f',
          600: '#6f5f4d',
          700: '#5a4d40',
          800: '#4a4037',
          900: '#3f3730',
        },
        status: {
          pending: '#f59e0b',
          approved: '#10b981',
          rejected: '#ef4444',
          processing: '#3b82f6',
          completed: '#6366f1',
          abnormal: '#f97316'
        }
      }
    },
  },
  plugins: [],
}

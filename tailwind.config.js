/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'museum': {
          'dark': '#1A3A3A',
          'darker': '#122A2A',
          'light': '#2A5A5A',
          'gold': '#D4A853',
          'gold-light': '#E8C57B',
          'coral': '#E07050',
          'orange': '#F0A660',
          'green': '#5A8A6C',
          'gray': {
            50: '#F8FAF9',
            100: '#F0F4F3',
            200: '#E1E8E7',
            300: '#C4D0CE',
            400: '#9AA8A6',
            500: '#717F7D',
            600: '#556260',
            700: '#444E4C',
            800: '#373F3D',
            900: '#2E3534',
          }
        }
      },
      fontFamily: {
        'serif': ['Noto Serif SC', 'serif'],
        'sans': ['Inter', 'sans-serif']
      },
      boxShadow: {
        'museum': '0 4px 20px rgba(26, 58, 58, 0.1)',
        'museum-hover': '0 8px 30px rgba(26, 58, 58, 0.15)',
      }
    },
  },
  plugins: [],
}

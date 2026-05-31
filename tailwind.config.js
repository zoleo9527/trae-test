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
        bakery: {
          brown: {
            50: '#FDF8F3',
            100: '#F5E6D3',
            200: '#E8D0B3',
            300: '#D4A574',
            400: '#C4956A',
            500: '#8B5A2B',
            600: '#6B4423',
            700: '#5D3A1A',
            800: '#4A2C17',
            900: '#3D2412',
          },
          cream: '#F5E6D3',
          matcha: '#7BA05B',
          alert: '#C2410C',
        },
      },
      fontFamily: {
        display: ['"Playfair Display', 'serif'],
        body: ['Lato', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
    },
  },
  plugins: [],
};

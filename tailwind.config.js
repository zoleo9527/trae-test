/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FDF8E7',
          100: '#FAEFC4',
          200: '#F4DE8C',
          300: '#EDCC54',
          400: '#E6BC2F',
          500: '#B8860B',
          600: '#997009',
          700: '#7A5A07',
          800: '#5C4405',
          900: '#3D2E03',
        },
        navy: {
          50: '#E8EEF4',
          100: '#C5D3E3',
          200: '#9EB4CF',
          300: '#7795BB',
          400: '#5A7DAD',
          500: '#1a365d',
          600: '#172F52',
          700: '#132744',
          800: '#0F1F36',
          900: '#0B1728',
        },
        cream: {
          50: '#FFFEF9',
          100: '#FFFDF3',
          200: '#FFFBED',
          300: '#FFF9E7',
          400: '#FFF7E1',
          500: '#FFF5DB',
        },
        coral: {
          500: '#E63946',
          600: '#D62828',
        },
        forest: {
          500: '#2D6A4F',
          600: '#1B4332',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 4px 20px rgba(184, 134, 11, 0.15)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'breathe': 'breathe 2s ease-in-out infinite',
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
        breathe: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}

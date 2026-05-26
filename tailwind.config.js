/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b1018',
          900: '#0f1622',
          800: '#131a27',
          700: '#1a2233',
          600: '#222b3e',
        },
        moss: {
          50: '#effaf4',
          100: '#d9f1e1',
          500: '#1f6b5a',
          600: '#1a584b',
          700: '#14483d',
        },
        amber2: {
          500: '#c98b2e',
          600: '#a9721f',
        },
        paper: '#f5f1e8',
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"PingFang SC"', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgba(201,139,46,0.35), 0 10px 40px -12px rgba(201,139,46,0.35)',
      },
      keyframes: {
        scanline: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        scanline: 'scanline 2.4s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

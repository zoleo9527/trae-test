/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#F0F9FB',
          100: '#D6EFF5',
          200: '#ADDFE8',
          300: '#7BC9D8',
          400: '#44ADC2',
          500: '#2A9D8F',
          600: '#0F4C5C',
          700: '#0D404D',
          800: '#0A333D',
          900: '#07252E',
        },
        accent: {
          50: '#FEF3EC',
          100: '#FDE2D1',
          200: '#FBC09C',
          300: '#F89A64',
          400: '#F47530',
          500: '#E36414',
          600: '#C25410',
          700: '#9A430D',
          800: '#77350A',
          900: '#5A2808',
        },
        warning: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F4A261',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

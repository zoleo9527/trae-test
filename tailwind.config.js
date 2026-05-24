/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        status: {
          pending: '#f59e0b',
          in_progress: '#3b82f6',
          review: '#8b5cf6',
          approved: '#10b981',
          rejected: '#ef4444',
          overdue: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: { 500: '#14b8a6' },
        yellow: { 400: '#facc15' },
      },
    },
  },
  plugins: [],
}

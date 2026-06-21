/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf9ee',
          100: '#f5d78e',
          200: '#e8b84b',
          300: '#c9951e',
          400: '#b8821a',
          500: '#9a6d15',
          600: '#7a5410',
          700: '#5a3c0a',
          800: '#3b2606',
          900: '#1a1208',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

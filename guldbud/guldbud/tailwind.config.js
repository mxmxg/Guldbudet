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
        // Warm ivory base — softer and more premium than cold stone
        cream: '#faf7f0',
        // Deep espresso-gold used for dark luxury sections
        espresso: {
          50: '#f7f3ea',
          100: '#e8dcc4',
          200: '#c9ad72',
          300: '#a8853f',
          400: '#7d5f24',
          500: '#5a4318',
          600: '#3f2f10',
          700: '#2a1f0a',
          800: '#1a1208',
          900: '#0f0a04',
        },
        // Refined metallic gold scale
        gold: {
          50: '#fdfaf0',
          100: '#faf0d4',
          200: '#f3dfa3',
          300: '#e8c766',
          400: '#d9ab3c',
          500: '#c2901f',
          600: '#a8791a',
          700: '#875d16',
          800: '#6b491a',
          900: '#5a3d18',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(42, 31, 10, 0.08), 0 4px 24px -8px rgba(42, 31, 10, 0.10)',
        lift: '0 8px 30px -8px rgba(42, 31, 10, 0.18), 0 2px 8px -2px rgba(42, 31, 10, 0.08)',
        gold: '0 8px 30px -6px rgba(194, 144, 31, 0.35)',
        'gold-lg': '0 12px 48px -8px rgba(194, 144, 31, 0.45)',
      },
      backgroundImage: {
        'gold-sheen':
          'linear-gradient(135deg, #f3dfa3 0%, #d9ab3c 30%, #a8791a 55%, #e8c766 80%, #c2901f 100%)',
        'gold-text':
          'linear-gradient(180deg, #f3dfa3 0%, #d9ab3c 45%, #a8791a 100%)',
        'espresso-glow':
          'radial-gradient(120% 90% at 50% -10%, rgba(217,171,60,0.20) 0%, rgba(217,171,60,0.06) 35%, transparent 70%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%, 100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.8s ease both',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 2.5s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'spin-slow': 'spin-slow 22s linear infinite',
      },
    },
  },
  plugins: [],
}

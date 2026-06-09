/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        valueFlash: {
          '0%': {
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            transform: 'scale(1.05)',
          },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' },
        },
      },
      animation: {
        valueFlash: 'valueFlash 0.7s ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

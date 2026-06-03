/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        bg:   '#0a0a0a',
        card: '#181818',
        line: '#1f1f1f',
      },
    },
  },
  plugins: [],
};

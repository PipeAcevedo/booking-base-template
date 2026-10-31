/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15263b',
        brand: { DEFAULT: '#286b5b', dark: '#1e5548', soft: '#e8f3ef' },
      },
      boxShadow: { card: '0 16px 50px rgba(21, 38, 59, 0.08)' },
    },
  },
  plugins: [],
};

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
        primary: {
          50: '#fef2f3',
          100: '#fde6e8',
          200: '#fbd0d5',
          300: '#f7aab3',
          400: '#f17a8b',
          500: '#e74c64',
          600: '#d32a4c',
          700: '#a51e36',  // 主色
          800: '#8b1c32',
          900: '#771c31',
          950: '#420a16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
/* eslint-env node */
module.exports = {
  content: [
    './popup/**/*.{html,js}',
    './content/**/*.js',
    './background/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          500: '#667eea',
          600: '#5a67d8',
          700: '#4c51bf',
          800: '#434190'
        },
        secondary: {
          500: '#764ba2',
          600: '#6b46c1',
          700: '#553c9a'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
};

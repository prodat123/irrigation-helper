/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {

    extend: {
      colors: {
        primary: '#63a07a',
        secondary: '#a0c9af',
        accent: '#84bf9a',
        text: '#0a0e0c',
        background: '#fbfcfb',
      },
    },
  },
  plugins: [],
}
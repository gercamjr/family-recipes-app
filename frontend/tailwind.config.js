/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        papaya: '#F06449',
        sunglow: '#FFD166',
        seaGreen: '#06D6A0',
        'sea-green': '#06D6A0',
        cerulean: '#118AB2',
        spaceCadet: '#073B4C',
        'space-cadet': '#073B4C',
        offWhite: '#FDF0D5',
        'off-white': '#FDF0D5',
        mintCream: '#E6FFFA',
        'mint-cream': '#E6FFFA',
      },
    },
  },
  plugins: [],
}

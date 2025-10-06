import { colors } from './src/theme/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        papaya: colors.papaya,
        sunglow: colors.sunglow,
        'sea-green': colors.seaGreen,
        cerulean: colors.cerulean,
        'space-cadet': colors.spaceCadet,
        'off-white': colors.offWhite,
      },
    },
  },
  plugins: [],
}

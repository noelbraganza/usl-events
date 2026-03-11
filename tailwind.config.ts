import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        usl: {
          purple: '#905AC0',
          pink: '#D03B6E',
          sky: '#6DDEF7',
          gold: '#E8B840',
        },
      },
      animation: {
        'gradient-spin': 'gradient-spin 6s linear infinite',
      },
      keyframes: {
        'gradient-spin': {
          '0%': { '--angle': '0deg' },
          '100%': { '--angle': '360deg' },
        },
      },
    },
  },
  plugins: [],
}

export default config

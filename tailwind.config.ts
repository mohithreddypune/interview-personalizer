import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:  '#060D18',
        surface:  '#0D1826',
        elevated: '#142035',
        border:   'rgba(255,255,255,0.08)',
        accent:   '#6C63FF',
        muted:    '#8B95A5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config

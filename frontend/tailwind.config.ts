import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0D13',
        surface: {
          50: '#1e2230',
          100: '#171a25',
          200: '#12151e',
          300: '#0e1017',
          400: '#080a0f',
        },
        accent: {
          light: '#a855f7',
          DEFAULT: '#8b5cf6',
          dark: '#7c3aed',
          glow: 'rgba(139, 92, 246, 0.35)',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.35)',
        },
        text: {
          primary: '#F3F4F6',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px rgba(139, 92, 246, 0.25)',
        'player-bar': '0 -8px 30px rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

// Farbwelt und Gestaltung übernommen aus LIQUODA_Praesentation.html:
// Ink (dunkles Navy) für Flächen und Titel, Petrol-Akzent für Aktionen
// und Status, warmes Creme als Seitenhintergrund.
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F7F5F1',
          light: '#FAF8F4',
          dark: '#F0EEE6',
        },
        // «navy» bleibt als Name erhalten, Werte entsprechen «ink» der Präsentation
        navy: {
          DEFAULT: '#0E2233',
          light: '#142F45',
          dark: '#091826',
        },
        accent: {
          DEFAULT: '#1FA88C',
          start: '#1FA88C',
          end: '#3ED1B0',
        },
        body: '#14181C',
        muted: '#5C6B77',
        // helle Textfarben auf dunklen Flächen
        onink: {
          DEFAULT: '#F2F4F6',
          muted: '#9FB0BC',
          chip: '#C6D2DB',
        },
        surface: '#F7F5F1',
      },
      backgroundImage: {
        accent: 'linear-gradient(120deg, #1FA88C 0%, #3ED1B0 100%)',
        ink: 'linear-gradient(160deg, #0E2233 0%, #142F45 100%)',
        page: 'linear-gradient(150deg, #FAF8F4 0%, #F5F2EC 55%, #F0EEE6 100%)',
      },
      boxShadow: {
        card: '0 2px 16px rgba(14, 34, 51, 0.07)',
        'card-hover': '0 10px 28px rgba(14, 34, 51, 0.12)',
        cta: '0 6px 18px rgba(31, 168, 140, 0.35)',
        'cta-hover': '0 6px 26px rgba(31, 168, 140, 0.6)',
        ink: '0 8px 30px rgba(14, 34, 51, 0.25)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        wordmark: ['Georgia', "'Times New Roman'", 'serif'],
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        logoIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%, 100%': { fill: '#1FA88C' },
          '50%': { fill: '#3ED1B0' },
        },
        drift1: {
          from: { transform: 'translate(0, 0) scale(1)' },
          to: { transform: 'translate(-6vw, 8vh) scale(1.15)' },
        },
        drift2: {
          from: { transform: 'translate(0, 0) scale(1)' },
          to: { transform: 'translate(7vw, -6vh) scale(1.1)' },
        },
      },
      animation: {
        rise: 'rise 0.65s cubic-bezier(0.2, 0.7, 0.3, 1) both',
        logoIn: 'logoIn 1.1s cubic-bezier(0.2, 0.7, 0.3, 1) both',
        shimmer: 'shimmer 3.2s ease-in-out infinite',
        drift1: 'drift1 26s ease-in-out infinite alternate',
        drift2: 'drift2 32s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};

export default config;

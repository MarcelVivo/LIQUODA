import type { Config } from 'tailwindcss';

// Farben gemäss LIQUODA_SPEC.md, Abschnitt 2 (Design):
// Creme als Hintergrund, Navy für Text und Flächen,
// Akzentverlauf nur für Aktionen und Status.
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
          DEFAULT: '#FAF7F0',
          dark: '#F1ECDF',
        },
        navy: {
          DEFAULT: '#0B2545',
          light: '#1B3A66',
          dark: '#071A33',
        },
        accent: {
          start: '#00C9A7',
          end: '#0085FF',
        },
        // Alias, damit bestehende Komponenten weiterhin funktionieren
        surface: '#FAF7F0',
      },
      backgroundImage: {
        accent: 'linear-gradient(90deg, #00C9A7 0%, #0085FF 100%)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        wordmark: ['Georgia', "'Times New Roman'", 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;

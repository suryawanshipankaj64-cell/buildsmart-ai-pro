import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A1526',
          900: '#0D1B2A',
          800: '#122542',
          700: '#1E3A5F',
          600: '#1E3A8A',
        },
        blueprint: {
          line: '#2A4A6B',
          grid: '#16283F',
        },
        signal: {
          amber: '#E8912D',
          teal: '#2DBF9E',
          coral: '#E8603C',
          slate: '#8EA3B8',
        },
        paper: '#F5F3ED',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular'],
      },
      backgroundImage: {
        blueprint: `linear-gradient(rgba(42,74,107,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(42,74,107,0.18) 1px, transparent 1px)`,
      },
      backgroundSize: { grid: '28px 28px' },
    },
  },
  plugins: [],
};
export default config;

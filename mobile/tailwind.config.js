/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './navigation/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          darkest: '#071224',
          dark: '#0B192C',
          surface: '#122542',
          surfaceHover: '#1A3356',
          border: '#2A4A6B',
          borderMuted: '#1E3754',
          accent: '#2DBF9E',      // Signal Teal
          accentGlow: 'rgba(45, 191, 158, 0.15)',
          info: '#1A73E8',        // Signal Blue
          infoGlow: 'rgba(26, 115, 232, 0.15)',
          amber: '#F59E0B',       // Signal Amber
          amberGlow: 'rgba(245, 158, 11, 0.15)',
          coral: '#EF4444',       // Signal Coral
          coralGlow: 'rgba(239, 68, 68, 0.15)',
          paper: '#F5F3ED',       // Paper White
          slate: '#8EABC7',       // Signal Slate
          grid: '#183459',
        },
      },
      fontFamily: {
        mono: ['monospace'],
      },
    },
  },
  plugins: [],
};


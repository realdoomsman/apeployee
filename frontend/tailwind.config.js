/** @type {import('tailwindcss').Config} */
// Palette straight from the token PFP: XP Bliss sky + grass, putty office
// plastic (classic #ECE9D8 dialog gray), banana, and a stamp red.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#ECE9D8', panel: '#F7F5EC', deep: '#DCD7C2' },
        ink: { DEFAULT: '#1E1D18', soft: '#6A6455' },
        line: { DEFAULT: '#C9C4AE', dark: '#A5A08B' },
        xp: { DEFAULT: '#2E6BD6', dark: '#1941A5', sky: '#3F8CDE', skylight: '#A9CCF0' },
        green: { DEFAULT: '#3F8A2A', soft: '#E0EBD8', grass: '#4CA332' },
        banana: { DEFAULT: '#E8B00C', soft: '#F6EBC4' },
        stampred: '#A63B2E',
        brown: '#7A5236',
      },
      fontFamily: {
        display: ['"Archivo Black"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(0.75)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      animation: { pop: 'pop 0.18s ease-out' },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#0B110D',
          800: '#101812',
          700: '#16211A',
          600: '#1D2B22',
          500: '#26382C',
        },
        line: '#25392B',
        banana: { DEFAULT: '#FFD34D', dark: '#E0B33A' },
        jungle: { DEFAULT: '#57A63A', dark: '#3F7E2A', bright: '#6DBE49' },
        ape: { DEFAULT: '#8B5E3C', dark: '#5E3A21', tan: '#E9C9A3' },
        lanyard: '#7A3E9D',
        ink: '#EDF3EE',
        mute: '#93A698',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pop: { '0%': { transform: 'scale(0.6)', opacity: '0' }, '70%': { transform: 'scale(1.06)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        marquee: 'marquee 45s linear infinite',
        'marquee-slow': 'marquee 70s linear infinite',
        floaty: 'floaty 5s ease-in-out infinite',
        pop: 'pop 0.35s ease-out',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
}

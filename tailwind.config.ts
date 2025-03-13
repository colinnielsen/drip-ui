import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        drip: ['var(--font-diary-notes)'],
        garamond: ['var(--font-garamond)'],
        libreFranklin: ['var(--font-libre-franklin)'],
        sans: ['var(--font-libre-franklin)'],
        mono: ['var(--font-roboto-mono)'],
      },
      colors: {
        'primary-gray': '#747474',
        'light-gray': '#E4E4E4',
        black: '#000000',
        'secondary-gray': '#C6C6C6',
        white: '#FFFFFF',
        'secondary-background': '#EFE8DB',
        'secondary-pop': '#446144',
        background: '#FBFBFB',
        'background-card': '#F9F9F9',
        'palette-foreground': '#0A0B0D',
        'drip-yellow': '#FAD809',
      },
      boxShadow: {
        drawer: '4px 0px 60px 0px rgba(0,0,0,0.40)',
        'drawer-secondary': '4px 0px 60px 0px rgba(0,0,0,0.20)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'cart-shake': {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(-5deg) scale(1.1)' },
          '50%': { transform: 'rotate(5deg) scale(1.1)' },
          '75%': { transform: 'rotate(-5deg) scale(1.1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'cart-shake': 'cart-shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(function ({ addVariant }) {
      addVariant('not-last', '&:not(:last-child)');
    }),
    require('@tailwindcss/typography'),
  ],
};

export default config;

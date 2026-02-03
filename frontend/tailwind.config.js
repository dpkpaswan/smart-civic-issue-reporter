/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)', /* slate-200 / slate-700 */
        input: 'var(--color-input)', /* slate-200 / slate-700 */
        ring: 'var(--color-ring)', /* blue-800 / blue-500 */
        background: 'var(--color-background)', /* gray-50 / slate-900 */
        foreground: 'var(--color-foreground)', /* gray-800 / slate-100 */
        primary: {
          DEFAULT: 'var(--color-primary)', /* blue-800 / blue-500 */
          foreground: 'var(--color-primary-foreground)', /* white */
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', /* slate-600 / slate-500 */
          foreground: 'var(--color-secondary-foreground)', /* white */
        },
        accent: {
          DEFAULT: 'var(--color-accent)', /* emerald-600 / emerald-500 */
          foreground: 'var(--color-accent-foreground)', /* white */
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', /* red-600 / red-700 */
          foreground: 'var(--color-destructive-foreground)', /* white */
        },
        success: {
          DEFAULT: 'var(--color-success)', /* emerald-500 / emerald-600 */
          foreground: 'var(--color-success-foreground)', /* white */
        },
        warning: {
          DEFAULT: 'var(--color-warning)', /* amber-500 / amber-600 */
          foreground: 'var(--color-warning-foreground)', /* gray-800 / white */
        },
        error: {
          DEFAULT: 'var(--color-error)', /* red-600 / red-700 */
          foreground: 'var(--color-error-foreground)', /* white */
        },
        muted: {
          DEFAULT: 'var(--color-muted)', /* slate-100 / slate-700 */
          foreground: 'var(--color-muted-foreground)', /* gray-500 / slate-400 */
        },
        card: {
          DEFAULT: 'var(--color-card)', /* slate-50 / slate-800 */
          foreground: 'var(--color-card-foreground)', /* gray-700 / slate-200 */
        },
        popover: {
          DEFAULT: 'var(--color-popover)', /* white / slate-800 */
          foreground: 'var(--color-popover-foreground)', /* gray-800 / slate-100 */
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)', /* 6px */
        DEFAULT: 'var(--radius-md)', /* 12px */
        md: 'var(--radius-md)', /* 12px */
        lg: 'var(--radius-lg)', /* 18px */
        xl: 'var(--radius-xl)', /* 24px */
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
        '144': '36rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Source Sans Pro', 'sans-serif'],
        caption: ['Nunito Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.4' }],
        'sm': ['0.875rem', { lineHeight: '1.4' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.5' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.25' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
      },
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        'elevation-0': 'none',
        'elevation-1': 'var(--shadow-sm)',
        'elevation-2': 'var(--shadow-md)',
        'elevation-3': 'var(--shadow-lg)',
        'elevation-4': 'var(--shadow-xl)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}
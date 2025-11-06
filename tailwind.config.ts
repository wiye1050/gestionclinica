import type { Config } from 'tailwindcss';

const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        card: 'hsl(var(--card))',
        cardHover: 'hsl(var(--card-hover))',
        border: 'hsl(var(--border))',
        muted: 'hsl(var(--muted))',
        text: 'hsl(var(--text))',
        textMuted: 'hsl(var(--text-muted))',
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          fg: 'hsl(var(--brand-fg))',
          subtle: 'hsl(var(--brand-subtle))'
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          bg: 'hsl(var(--success-bg))'
        },
        warn: {
          DEFAULT: 'hsl(var(--warn))',
          bg: 'hsl(var(--warn-bg))'
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          bg: 'hsl(var(--danger-bg))'
        }
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        pill: '999px'
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,.06)',
        md: '0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)',
        lg: '0 2px 8px rgba(0,0,0,.08), 0 16px 32px rgba(0,0,0,.08)'
      },
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem'
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pulse-soft': {
          '0%,100%': { opacity: 0.65 },
          '50%': { opacity: 1 }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      },
      animation: {
        'fade-in': 'fade-in .18s ease-out',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite'
      },
      fontSize: {
        label: ['0.8125rem', { letterSpacing: '.005em', fontWeight: '500' }]
      },
      screens: {
        '2xl': '1440px'
      }
    }
  },
  plugins: []
} satisfies Config;

export default config;

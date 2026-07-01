/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Nombrado "canvas" (no "base") para no colisionar con text-base font-size de Tailwind
        canvas: {
          DEFAULT: '#080B11',
          surface: '#0F1219',
          elevated: '#161B25',
          border: '#1E2535',
        },
        ink: {
          DEFAULT: '#F0F2F5',
          muted: '#8B93A4',
          faint: '#4A5263',
        },
        accent: {
          positive: '#34D399',
          negative: '#F87171',
          warning: '#FBBF24',
          info: '#60A5FA',
          brand: '#8B5CF6',
        },
      },
      borderRadius: {
        card: '20px',
      },
      fontSize: {
        'amount-lg': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '800' }],
        'amount-md': ['1.5rem', { lineHeight: '1.875rem', fontWeight: '700' }],
        'amount-sm': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.5), 0 8px 32px -8px rgba(0,0,0,0.6)',
        'card-hover': '0 1px 2px rgba(0,0,0,0.5), 0 16px 48px -8px rgba(0,0,0,0.7)',
        glow: '0 0 24px rgba(96,165,250,0.12)',
        'glow-positive': '0 0 24px rgba(52,211,153,0.12)',
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        glass: '20px',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'number-up': {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'number-up': 'number-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
